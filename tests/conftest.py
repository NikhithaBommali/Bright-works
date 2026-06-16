import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend'))

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import main
from app.persistence import DATA_DIR, FAVORITES_FILE, PREFERENCES_FILE, PLANS_FILE


@pytest.fixture(autouse=True)
def clean_persistence_files():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    for path in (PREFERENCES_FILE, PLANS_FILE, FAVORITES_FILE):
        if path.exists():
            path.unlink()
    yield
    for path in (PREFERENCES_FILE, PLANS_FILE, FAVORITES_FILE):
        if path.exists():
            path.unlink()


@pytest.fixture
def app() -> FastAPI:
    return main.app


@pytest.fixture
def client(app: FastAPI) -> TestClient:
    with TestClient(app) as test_client:
        yield test_client
