from pydantic import BaseModel, field_validator, ConfigDict
import re
from app.models.enums import BrazilianStates

class Client(BaseModel):
    name: str
    cnpj: str
    state: BrazilianStates

    #Configuração para permitir a serialização customizada (LGPD)
    model_config = ConfigDict(from_attributes=True)

    @field_validator("cnpj")
    @classmethod
    def validate_cnpj_numeric(cls, v: str) -> str:
        #Remove caracteres especiais e valida apenas números
        numbers_only = re.sub(r"\D", "", v)
        if len(numbers_only) != 14:
            raise ValueError("CNPJ deve conter exatamente 14 números")
        return numbers_only

    def safe_dict(self):
        """Retorna o dicionário excluindo dados sensíveis para logs."""
        return self.model_dump(exclude={"cnpj"})