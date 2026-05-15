from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from typing import AsyncGenerator

#URL que aponta para o seu container Docker
DATABASE_URL = "postgresql+asyncpg://user_alfalux:password_alfalux@db:5432/alfalux_propostas"

#1. Configurar AsyncEngine
engine = create_async_engine(DATABASE_URL, echo=True)

#2. Configurando o async_sessionmaker
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()