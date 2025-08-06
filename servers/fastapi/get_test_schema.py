import json
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, HttpUrl, EmailStr

from models.presentation_layout import PresentationLayoutModel, SlideLayoutModel
from models.presentation_outline_model import PresentationOutlineModel
from utils.dict_utils import get_dict_at_path, get_dict_paths_with_key
from utils.schema_utils import remove_fields_from_schema


class ContactInfoModel(BaseModel):
    email: Optional[EmailStr] = Field(None, description="Contact email")
    phone: Optional[str] = Field(
        None, min_length=5, max_length=50, description="Contact phone number"
    )
    website: Optional[HttpUrl] = Field(None, description="Website URL")


class ImageModel(BaseModel):
    __image_url__: str = Field(description="Image URL")
    __image_prompt__: str = Field(description="Image prompt")


# First Slide Layout
class FirstSlideModel(BaseModel):
    title: str = Field(
        min_length=3,
        max_length=100,
        description="Main title of the presentation",
    )
    subtitle: Optional[str] = Field(
        min_length=10, max_length=200, description="Optional subtitle or tagline"
    )
    author: Optional[str] = Field(
        min_length=2,
        max_length=100,
        description="Author or presenter name",
    )
    date: Optional[str] = Field(description="Presentation date")
    company: Optional[str] = Field(
        min_length=2,
        max_length=100,
        description="Company or organization name",
    )
    backgroundImage: Optional[ImageModel] = Field(
        description="Background image for the slide"
    )


# Bullet Point Slide Layout
class BulletPointSlideModel(BaseModel):
    title: str = Field(
        min_length=3,
        max_length=100,
        description="Title of the slide",
    )
    subtitle: Optional[str] = Field(
        min_length=3,
        max_length=150,
        description="Optional subtitle or description",
    )
    icon: Optional[str] = Field(description="Icon to display in the slide")
    bulletPoints: List[str] = Field(
        min_length=2,
        max_length=8,
        description="List of bullet points (2-8 items)",
    )


# Image Slide Layout
class ImageSlideModel(BaseModel):
    title: str = Field(
        min_length=3,
        max_length=100,
        description="Title of the slide",
    )
    subtitle: Optional[str] = Field(
        min_length=3,
        max_length=150,
        description="Optional subtitle or description",
    )
    image: HttpUrl = Field(
        description="Main image URL",
    )
    imageCaption: Optional[str] = Field(
        min_length=5,
        max_length=200,
        description="Optional image caption or description",
    )
    content: Optional[str] = Field(
        min_length=10,
        max_length=600,
        description="Optional supporting content text",
    )
    backgroundImage: Optional[HttpUrl] = Field(
        description="URL to background image for the slide"
    )


# Statistics Slide Layout
class StatisticItemModel(BaseModel):
    value: str = Field(
        min_length=1,
        max_length=20,
        description="Statistical value (e.g., '250%', '$1.2M', '99.9%')",
    )
    label: str = Field(
        min_length=3, max_length=100, description="Description of the statistic"
    )
    trend: Optional[str] = Field(
        description="Trend direction indicator", pattern="^(up|down|neutral)$"
    )
    context: Optional[str] = Field(
        min_length=5,
        max_length=200,
        description="Additional context or time period",
    )


class StatisticsSlideModel(BaseModel):
    title: str = Field(
        min_length=3,
        max_length=100,
        description="Title of the slide",
    )
    subtitle: Optional[str] = Field(
        min_length=3,
        max_length=150,
        description="Optional subtitle or description",
    )
    statistics: List[StatisticItemModel] = Field(
        min_length=2,
        max_length=6,
        description="List of statistics (2-6 items)",
    )
    backgroundImage: Optional[HttpUrl] = Field(
        description="URL to background image for the slide"
    )


# Quote Slide Layout
class QuoteSlideModel(BaseModel):
    title: str = Field(
        min_length=3,
        max_length=100,
        description="Title of the slide",
    )
    subtitle: Optional[str] = Field(
        min_length=3,
        max_length=150,
        description="Optional subtitle or description",
    )
    quote: str = Field(
        min_length=10,
        max_length=500,
        description="The main quote or testimonial",
    )
    author: str = Field(
        min_length=2,
        max_length=100,
        description="Quote author name",
    )
    authorTitle: Optional[str] = Field(
        min_length=2, max_length=100, description="Author job title or position"
    )
    company: Optional[str] = Field(
        min_length=2, max_length=100, description="Author company or organization"
    )
    authorImage: Optional[HttpUrl] = Field(description="URL to author photo")
    backgroundImage: Optional[HttpUrl] = Field(
        description="URL to background image for the slide"
    )


# Timeline Slide Layout
class TimelineItemModel(BaseModel):
    date: str = Field(min_length=2, max_length=50, description="Date or time period")
    title: str = Field(
        min_length=3, max_length=100, description="Event or milestone title"
    )
    description: str = Field(
        min_length=10, max_length=300, description="Event description"
    )
    status: str = Field(
        description="Timeline item status",
        pattern="^(completed|current|upcoming)$",
    )


class TimelineSlideModel(BaseModel):
    title: str = Field(
        min_length=3,
        max_length=100,
        description="Title of the slide",
    )
    subtitle: Optional[str] = Field(
        min_length=3,
        max_length=150,
        description="Optional subtitle or description",
    )
    timelineItems: List[TimelineItemModel] = Field(
        min_length=2,
        max_length=6,
        description="Timeline events (2-6 items)",
    )
    backgroundImage: Optional[HttpUrl] = Field(
        description="URL to background image for the slide"
    )


# Team Slide Layout
class TeamMemberModel(BaseModel):
    name: str = Field(min_length=2, max_length=100, description="Team member name")
    title: str = Field(min_length=2, max_length=100, description="Job title or role")
    image: Optional[HttpUrl] = Field(description="URL to team member photo")
    bio: Optional[str] = Field(
        min_length=10,
        max_length=300,
        description="Brief biography or description",
    )
    email: Optional[EmailStr] = Field(description="Contact email")
    linkedin: Optional[HttpUrl] = Field(description="LinkedIn profile URL")


class TeamSlideModel(BaseModel):
    title: str = Field(
        min_length=3,
        max_length=100,
        description="Title of the slide",
    )
    subtitle: Optional[str] = Field(
        min_length=3,
        max_length=150,
        description="Optional subtitle or team description",
    )
    teamMembers: List[TeamMemberModel] = Field(
        min_length=1,
        max_length=6,
        description="Team members (1-6 people)",
    )
    backgroundImage: Optional[HttpUrl] = Field(
        description="URL to background image for the slide"
    )


# Process Slide Layout
class ProcessStepModel(BaseModel):
    step: int = Field(ge=1, le=10, description="Step number")
    title: str = Field(min_length=3, max_length=100, description="Step title")
    description: str = Field(
        min_length=10, max_length=200, description="Step description"
    )


class ProcessSlideModel(BaseModel):
    title: str = Field(
        min_length=3,
        max_length=100,
        description="Title of the slide",
    )
    subtitle: Optional[str] = Field(
        min_length=3,
        max_length=150,
        description="Optional subtitle or description",
    )
    processSteps: List[ProcessStepModel] = Field(
        min_length=2,
        max_length=6,
        description="Process steps (2-6 items)",
    )
    backgroundImage: Optional[HttpUrl] = Field(
        description="URL to background image for the slide"
    )


# Two Column Slide Layout
class ColumnContentModel(BaseModel):
    title: str = Field(min_length=3, max_length=100, description="Column title")
    content: str = Field(min_length=10, max_length=800, description="Column content")


class TwoColumnSlideModel(BaseModel):
    title: str = Field(
        min_length=3,
        max_length=100,
        description="Title of the slide",
    )
    subtitle: Optional[str] = Field(
        min_length=3,
        max_length=150,
        description="Optional subtitle or description",
    )
    leftColumn: ColumnContentModel = Field(
        description="Left column content",
    )
    rightColumn: ColumnContentModel = Field(
        description="Right column content",
    )
    backgroundImage: Optional[HttpUrl] = Field(
        description="URL to background image for the slide"
    )


# Conclusion Slide Layout
class ConclusionSlideModel(BaseModel):
    title: str = Field(
        min_length=3,
        max_length=100,
        description="Title of the slide",
    )
    subtitle: Optional[str] = Field(
        min_length=3,
        max_length=150,
        description="Optional subtitle or description",
    )
    keyTakeaways: List[str] = Field(
        min_length=2,
        max_length=6,
        description="Key takeaways or summary points (2-6 items)",
    )
    callToAction: Optional[str] = Field(
        min_length=5,
        max_length=150,
        description="Optional call to action or next steps",
    )
    contactInfo: Optional[ContactInfoModel] = Field(
        description="Optional contact information"
    )
    backgroundImage: Optional[HttpUrl] = Field(
        description="URL to background image for the slide"
    )


# Content Slide Layout
class ContentSlideModel(BaseModel):
    title: str = Field(
        min_length=3,
        max_length=100,
        description="Title of the slide",
    )
    subtitle: Optional[str] = Field(
        min_length=3,
        max_length=150,
        description="Optional subtitle or description",
    )
    content: str = Field(
        min_length=10,
        max_length=1000,
        description="Main content text",
    )
    backgroundImage: Optional[HttpUrl] = Field(
        description="URL to background image for the slide"
    )


# Create the presentation layout with all slide types
presentation_layout = PresentationLayoutModel(
    name="Complete Presentation Layout",
    slides=[
        SlideLayoutModel(
            id="first-slide",
            name="First Slide",
            json_schema=FirstSlideModel.model_json_schema(),
        ),
        # SlideLayoutModel(
        #     id="bullet-point-slide",
        #     name="Bullet Point Slide",
        #     json_schema=BulletPointSlideModel.model_json_schema(),
        # ),
        # SlideLayoutModel(
        #     id="image-slide",
        #     name="Image Slide",
        #     json_schema=ImageSlideModel.model_json_schema(),
        # ),
        # SlideLayoutModel(
        #     id="statistics-slide",
        #     name="Statistics Slide",
        #     json_schema=StatisticsSlideModel.model_json_schema(),
        # ),
        # SlideLayoutModel(
        #     id="quote-slide",
        #     name="Quote Slide",
        #     json_schema=QuoteSlideModel.model_json_schema(),
        # ),
        # SlideLayoutModel(
        #     id="timeline-slide",
        #     name="Timeline Slide",
        #     json_schema=TimelineSlideModel.model_json_schema(),
        # ),
        # SlideLayoutModel(
        #     id="team-slide",
        #     name="Team Slide",
        #     json_schema=TeamSlideModel.model_json_schema(),
        # ),
        # SlideLayoutModel(
        #     id="process-slide",
        #     name="Process Slide",
        #     json_schema=ProcessSlideModel.model_json_schema(),
        # ),
        # SlideLayoutModel(
        #     id="two-column-slide",
        #     name="Two Column Slide",
        #     json_schema=TwoColumnSlideModel.model_json_schema(),
        # ),
        # SlideLayoutModel(
        #     id="conclusion-slide",
        #     name="Conclusion Slide",
        #     json_schema=ConclusionSlideModel.model_json_schema(),
        # ),
        # SlideLayoutModel(
        #     id="content-slide",
        #     name="Content Slide",
        #     json_schema=ContentSlideModel.model_json_schema(),
        # ),
    ],
)


print(json.dumps(StatisticsSlideModel.model_json_schema()))
