from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, ForeignKey, Float
from app.models.base import Base

class ClientModel(Base):
    __tablename__ = "clients"

    name: Mapped[str] = mapped_column(String(255))
    cnpj: Mapped[str] = mapped_column(String(14), unique=True)
    state: Mapped[str] = mapped_column(String(2))

class ProposalModel(Base):
    __tablename__ = "proposals"

    #id e created_at já vêm da Base
    description: Mapped[str] = mapped_column(String(500))
    total_value: Mapped[float] = mapped_column(Float)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))

class ProductModel(Base):
    __tablename__ = "products"

    code: Mapped[str] = mapped_column(String(50), primary_key=True) #O SKU/Código que você vai digitar
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(String(500), nullable=True)
    price: Mapped[float] = mapped_column(Float)
    image_url: Mapped[str] = mapped_column(String(1000), nullable=True)
