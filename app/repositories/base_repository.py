from typing import TypeVar, Generic, Type, Optional, List

from sqlalchemy import Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.base import Base

T = TypeVar("T", bound=Base)

class BaseRepository(Generic[T]):
    def __init__(self, model: Type[T], session: AsyncSession):
        self.model = model
        self.session = session

    async def get(self, id: int) -> Optional[T]:
        return await self.session.get(self.model, id)

    async def create(self, obj_int: T) -> T:
        self.session.add(obj_int)
        await self.session.commit()
        await self.session.refresh(obj_int)
        return obj_int

    async def filter(self, **kwargs) -> Sequence[T]:
        query = select(self.model).filter_by(**kwargs)
        result = await self.session.execute(query)
        return result.scalars().all()
