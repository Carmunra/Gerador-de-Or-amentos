from pydantic import BaseModel, field_validator, Field

class ClientCreate(BaseModel):
    name: str = Field(..., description="Nome completo ou razão social do cliente")
    cnpj: str = Field(..., description="CNPJ apenas números (14 dígitos)")
    state: str = Field(..., description="Sigla do estado (UF) com 2 caracteres")