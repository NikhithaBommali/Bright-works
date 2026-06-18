# API CONTRACT
# GET  /api/contacts
#   query: search: string | null
#   response: [{id: number, name: string, email: string | null, phone: string | null, company: string | null, notes: string | null}]
#
# POST /api/contacts
#   request:  {name: string, email: string | null, phone: string | null, company: string | null, notes: string | null}
#   response: {id: number, name: string, email: string | null, phone: string | null, company: string | null, notes: string | null}
#
# GET  /api/contacts/{contact_id}
#   response: {id: number, name: string, email: string | null, phone: string | null, company: string | null, notes: string | null}
#
# PUT  /api/contacts/{contact_id}
#   request:  {name: string, email: string | null, phone: string | null, company: string | null, notes: string | null}
#   response: {id: number, name: string, email: string | null, phone: string | null, company: string | null, notes: string | null}
#
# DELETE /api/contacts/{contact_id}
#   response: 204 No Content

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from starlette.requests import Request
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.contact import Contact
from app.schemas.contact import ContactCreate, ContactRead, ContactUpdate

router = APIRouter(prefix="/api/contacts", tags=["contacts"])


@router.post("", response_model=ContactRead, status_code=status.HTTP_201_CREATED)
async def create_contact(payload: ContactCreate, db: Session = Depends(get_db)) -> Contact:
    contact = Contact(**payload.model_dump())
    db.add(contact)
    db.flush()
    db.refresh(contact)
    return contact


@router.get("", response_model=list[ContactRead])
async def list_contacts(search: str | None = Query(default=None), db: Session = Depends(get_db)) -> list[Contact]:
    stmt = select(Contact)
    if search:
        stmt = stmt.where(Contact.name.ilike(f"%{search}%"))
    stmt = stmt.order_by(Contact.name.asc(), Contact.id.asc())
    return list(db.scalars(stmt).all())


@router.get("/{contact_id}", response_model=ContactRead)
async def get_contact(contact_id: int, db: Session = Depends(get_db)) -> Contact:
    contact = db.get(Contact, contact_id)
    if contact is None:
        raise HTTPException(status_code=404, detail={"error": "contact_not_found", "message": "Contact not found"})
    return contact


@router.put("/{contact_id}", response_model=ContactRead)
async def update_contact(contact_id: int, payload: ContactUpdate, db: Session = Depends(get_db)) -> Contact:
    contact = db.get(Contact, contact_id)
    if contact is None:
        raise HTTPException(status_code=404, detail={"error": "contact_not_found", "message": "Contact not found"})
    for key, value in payload.model_dump().items():
        setattr(contact, key, value)
    db.add(contact)
    db.flush()
    db.refresh(contact)
    return contact


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(contact_id: int, db: Session = Depends(get_db)) -> Response:
    contact = db.get(Contact, contact_id)
    if contact is None:
        raise HTTPException(status_code=404, detail={"error": "contact_not_found", "message": "Contact not found"})
    db.delete(contact)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
