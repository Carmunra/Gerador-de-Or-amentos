from django.conf.global_settings import INTERNAL_IPS
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List
from app.models.client import Client
from app.models.product import Product
from abc import ABC, abstractmethod

#Tabela de Alíquota Internas (ICMS + FCP)
# Exemplo: RJ é 20% + 2% FCP = 22% (0.22)
TAX_TABLE = {
    "RS": {"internal": 0.18, "inter": 0.12, "fcp": 0.00},
    "SC": {"internal": 0.17, "inter": 0.12, "fcp": 0.00},
    "PR": {"internal": 0.195, "inter": 0.12, "fcp": 0.02},
    "MG": {"internal": 0.18, "inter": 0.12, "fcp": 0.02},
    "RJ": {"internal": 0.20, "inter": 0.12, "fcp": 0.02},
    "ES": {"internal": 0.17, "inter": 0.07, "fcp": 0.02},
    "AC": {"internal": 0.19, "inter": 0.07, "fcp": 0.00},
    "RO": {"internal": 0.195, "inter": 0.07, "fcp": 0.02},
    "AM": {"internal": 0.20, "inter": 0.07, "fcp": 0.02},
    "RR": {"internal": 0.20, "inter": 0.07, "fcp": 0.02},
    "PA": {"internal": 0.19, "inter": 0.07, "fcp": 0.00},
    "AP": {"internal": 0.18, "inter": 0.07, "fcp": 0.00},
    "TO": {"internal": 0.20, "inter": 0.07, "fcp": 0.02},
    "MA": {"internal": 0.23, "inter": 0.07, "fcp": 0.02},
    "PI": {"internal": 0.225, "inter": 0.07, "fcp": 0.02},
    "CE": {"internal": 0.20, "inter": 0.07, "fcp": 0.02},
    "RN": {"internal": 0.20, "inter": 0.07, "fcp": 0.02},
    "PB": {"internal": 0.20, "inter": 0.07, "fcp": 0.02},
    "PE": {"internal": 0.205, "inter": 0.07, "fcp": 0.02},
    "AL": {"internal": 0.20, "inter": 0.07, "fcp": 0.02},
    "SE": {"internal": 0.20, "inter": 0.07, "fcp": 0.02},
    "BA": {"internal": 0.205, "inter": 0.07, "fcp": 0.02},
    "MT": {"internal": 0.17, "inter": 0.07, "fcp": 0.02},
    "GO": {"internal": 0.19, "inter": 0.07, "fcp": 0.02},
    "DF": {"internal": 0.20, "inter": 0.07, "fcp": 0.02},
    "MS": {"internal": 0.17, "inter": 0.07, "fcp": 0.02},
}

#--- Strategy Pattern para Tributação ---
class TaxStrategy(ABC):
    @abstractmethod
    def calculate(self, base_value: float) -> float:
        pass

class SaneStateTax(TaxStrategy):
    """Operação Interna (Ex: SP para SP) - Sem acréscimo de DIFAL"""
    def calculate(self, base_value: float) -> float:
        return base_value

class DIFALTax(TaxStrategy):
    """Calcula o acréscimo baseado na diferença de alíquota entre estados"""
    def __init__(self, destination_uf: str):
        self.destination_uf = destination_uf

    def calculate(self, base_value: float) -> float:
        # Busca dados da tabela ou usa um padrão conservador (SP->SP)
        tax = TAX_TABLE.get(self.destination_uf)

        if not tax:
            return base_value

        # Cálculo conforme coluna "DIFERENCIAL DE ALÍQUOTA"
        difal_rate = (tax["internal"] + tax["fcp"]) - tax["inter"]
        return round(base_value * (1 + difal_rate), 2)

#--- Factory para selecionar a Estratégia ---
def get_tax_strategy(origin: str, destination:str) -> TaxStrategy:
    if origin == destination:
        return SaneStateTax()
    return DIFALTax(destination)

def format_currency(value: float) -> str:
    return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

#--- Modelo Summary ---
class Summary(BaseModel):
    sku: int = Field(..., description="O sku do produto")
    client: Client
    products: List[Product]
    total_price: float = Field(default=0.0, ge=0)
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.now)
    origin_state: str = "SP"

    def apply_tax_logic(self):
        raw_total = sum(p.price for p in self.products)
        # Seleciona a estratégia baseada na origem vs destino
        strategy = get_tax_strategy(self.origin_state, self.client.state)
        self.total_price = round(strategy.calculate(raw_total),2)
        return self.total_price

class SummaryResponse(BaseModel):
    """ResponseModel: Oculta dados sensíveis como CNPJ na resposta da API"""
    sku: int
    client_name: str
    state: str
    items_count: int
    total_price: float
    total_price_formatted: str