from pydantic import BaseModel, field_validator, Field
from datetime import datetime

class ProposalCreate(BaseModel):
    """Schema para criação de propostas com validação rigorosa."""
    description: str = Field(..., description="Descrição detalhada do serviço")
    total_value: float = Field(..., gt=0, description="Total do valor da proposta")
    client_id: int

    @field_validator('total_value')
    @classmethod
    def validate_value(cls, v: float) -> float:
        if v <= 0:
            raise ValueError('Total do valor deve ser positivo')
        return v
