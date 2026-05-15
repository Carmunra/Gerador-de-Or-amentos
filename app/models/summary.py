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
    """
    Entidade central que consolida os dados de um orçamento comercial.
    Realiza o cálculo automático de impostos (DIFAL) baseado na UF de destino.
    """
    sku: int = Field(
        ...,
        description="Identificador único da proposta/orçamento.",
        example=1025
    )
    client: Client = Field(
        ...,
        description="Dados do cliente, incluindo CNPJ para validação na BrasilAPI"
    )
    products: List[Product] = Field(
        ...,
        description="Lista de produtos selecionados para o orçamento."
    )
    total_price: float = Field(
        default=0.0,
        ge=0,
        description="Valor total calculado (preço base + impostos).",
        example=1550.50
    )
    is_active: bool = Field(
        default=True,
        description="Status de validade da proposta comercial."
    )
    created_at: datetime = Field(
        default_factory=datetime.now,
        description="Data e hora de geração do registro."
    )
    origin_state: str = Field(
        default="SP",
        description="UF de origem da mercadoria para cálculo do DIFAL.",
        example="SP"
    )

    def apply_tax_logic(self):
        raw_total = sum(p.price for p in self.products)
        # Seleciona a estratégia baseada na origem vs destino
        strategy = get_tax_strategy(self.origin_state, self.client.state)
        self.total_price = round(strategy.calculate(raw_total),2)
        return self.total_price

class SummaryResponse(BaseModel):
    """ResponseModel: Oculta dados sensíveis como CNPJ na resposta da API"""
    sku: int = Field(..., description="SKU da proposta.")
    client_name: str = Field(..., description="Razão Social higienizada via BrasilAPI.",
                             example="Alfalux Industrial LTDA")
    state: str = Field(..., description="Estado do cliente validado.", example="RJ")
    items_count: int = Field(..., description="Quantidade total de itens no carrinho.", example=5)
    total_price: float = Field(..., description="Valor final numérico.")
    total_price_formatted: str = Field(..., description="Valor final formatado em moeda nacional.",
                                       example="R$ 1.550,50")