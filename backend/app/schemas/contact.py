from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


class ContactBase(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    notes: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("name must be non-empty")
        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str | None) -> str | None:
        if value is None:
            return value
        EmailStr(value)
        return value


class ContactCreate(ContactBase):
    pass


class ContactUpdate(ContactBase):
    pass


class ContactRead(ContactBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
