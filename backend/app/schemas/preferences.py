from pydantic import BaseModel, Field


class Preference(BaseModel):
    numberOfKids: float = Field(default=1)
    ageRange: str = ""
    dietaryRestrictions: list[str] = Field(default_factory=list)
    foodsToAvoid: str = ""
    cuisinePreferences: list[str] = Field(default_factory=list)


class PreferencesEnvelope(BaseModel):
    preferences: Preference
