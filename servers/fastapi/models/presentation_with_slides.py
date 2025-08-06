from typing import List, Optional
from datetime import datetime

from pydantic import BaseModel

from models.presentation_layout import PresentationLayoutModel
from models.presentation_outline_model import SlideOutlineModel
from models.presentation_structure_model import PresentationStructureModel
from models.sql.presentation import PresentationModel
from models.sql.slide import SlideModel


class PresentationWithSlides(BaseModel):
    id: str
    prompt: str
    n_slides: int
    language: str
    title: Optional[str] = None
    notes: Optional[List[str]]
    outlines: Optional[List[SlideOutlineModel]]
    summary: Optional[str]
    created_at: datetime
    updated_at: datetime
    layout: Optional[PresentationLayoutModel]
    structure: Optional[PresentationStructureModel]
    slides: List[SlideModel]

    def to_presentation_model(self) -> PresentationModel:
        return PresentationModel(**self.model_dump())
