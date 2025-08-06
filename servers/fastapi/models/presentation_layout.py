from typing import List, Optional
from pydantic import BaseModel, Field

from models.presentation_structure_model import PresentationStructureModel


class SlideLayoutModel(BaseModel):
    id: str
    name: Optional[str] = None
    description: Optional[str] = None
    json_schema: dict


class PresentationLayoutModel(BaseModel):
    name: Optional[str] = None
    ordered: bool = Field(default=False)
    slides: List[SlideLayoutModel]

    def to_presentation_structure(self):
        return PresentationStructureModel(
            slides=[index for index in range(len(self.slides))]
        )

    def to_string(self):
        message = f"## Presentation Layout\n\n"
        for index, slide in enumerate(self.slides):
            message += f"### Slide Layout: {index}: \n"
            message += f"- Name: {slide.name or slide.json_schema.get('title')} \n"
            message += f"- Description: {slide.description} \n\n"
        return message
