from sqlalchemy.orm import DeclarativeBase, mapped_column, Mapped
from sqlalchemy import func
from datetime import datetime

class Base(DeclarativeBase):
    #Campos que toda tabela terá (opcional, mas recomendado)
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())