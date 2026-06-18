from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


class ContactBase(BaseModel):
    name: str
    email: EmailStr | None = None
    phone: str | None = None
    company: str | None = None
    notes: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("name must be non-empty")
        return value.strip()


class ContactCreate(ContactBase):
    pass


class ContactUpdate(ContactBase):
    pass


class ContactRead(ContactBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
