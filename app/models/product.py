from pydantic import BaseModel, Field

class Product(BaseModel):
    name: str
    price: float = Field(gt=0, description="O preço deve ser maior que zero")
    category: str
    