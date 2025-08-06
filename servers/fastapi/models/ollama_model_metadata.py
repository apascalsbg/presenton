from pydantic import BaseModel


class OllamaModelMetadata(BaseModel):
    label: str
    value: str
    description: str
    icon: str
    size: str
    supports_graph: bool
