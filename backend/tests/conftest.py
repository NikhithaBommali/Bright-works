import os
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, get_db  # noqa: E402
from app.models.todo import Todo  # noqa: E402
from main import app  # noqa: E402


@pytest.fixture()
def db_session(monkeypatch):
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
            db.commit()
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestingSessionLocal()
    finally:
        app.dependency_overrides.clear()


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client
