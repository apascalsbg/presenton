from collections.abc import AsyncGenerator
import os
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
)
from sqlmodel import SQLModel

from utils.get_env import get_app_data_directory_env, get_database_url_env


database_url = get_database_url_env() or "sqlite+aiosqlite:///" + os.path.join(
    get_app_data_directory_env() or "/tmp/presenton", "fastapi.db"
)
connect_args = {}
if "sqlite" in database_url:
    connect_args["check_same_thread"] = False

sql_engine: AsyncEngine = create_async_engine(database_url, connect_args=connect_args)
async_session_maker = async_sessionmaker(sql_engine, expire_on_commit=False)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session


async def create_db_and_tables():
    async with sql_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
