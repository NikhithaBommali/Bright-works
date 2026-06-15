import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT / "backend"

sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(BACKEND_DIR))

import importlib

import pytest
from httpx import ASGITransport, AsyncClient


@pytest.fixture
async def client(tmp_path, monkeypatch):
    data_dir = tmp_path / "data"
    monkeypatch.setenv("BW_DATA_DIR", str(data_dir))

    sys.modules.pop("main", None)
    sys.modules.pop("app.database", None)
    sys.modules.pop("app.models.task", None)
    sys.modules.pop("app.schemas.task", None)

    app_module = importlib.import_module("main")
    app_module.init_db()

    transport = ASGITransport(app=app_module.app)
    async with AsyncClient(transport=transport, base_url="http://test") as test_client:
        yield test_client
