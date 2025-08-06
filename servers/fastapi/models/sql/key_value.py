from sqlmodel import SQLModel, Field, Column, JSON

from utils.randomizers import get_random_uuid


class KeyValueSqlModel(SQLModel, table=True):
    id: str = Field(default_factory=get_random_uuid, primary_key=True)
    key: str = Field(index=True)
    value: dict = Field(sa_column=Column(JSON))
