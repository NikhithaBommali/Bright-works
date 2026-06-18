from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers.contacts import router as contacts_router


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
#   response: {"ok": true}


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Rolodex API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(contacts_router)
