from pydantic import BaseModel, Field


class Preference(BaseModel):
    numberOfKids: int = Field(default=1, ge=0)
    ageRange: str = "2-5"
    dietaryRestrictions: list[str] = Field(default_factory=list)
    foodsToAvoid: str = ""
    cuisinePreferences: list[str] = Field(default_factory=list)
