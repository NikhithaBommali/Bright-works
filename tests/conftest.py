import os
import sys
from pathlib import Path

import pytest_asyncio
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest_asyncio.fixture
async def client(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("BW_DATA_DIR", str(tmp_path))

    import importlib

    sys.modules.pop("main", None)
    main = importlib.import_module("main")

    transport = ASGITransport(app=main.app)
    async with main.app.router.lifespan_context(main.app):
        async with AsyncClient(transport=transport, base_url="http://testserver") as async_client:
            yield async_client
