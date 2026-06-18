from __future__ import annotations

import json
import os
from pathlib import Path
from threading import Lock
from typing import Any, Callable

DATA_DIR = Path(os.environ.get("BW_DATA_DIR", Path(__file__).resolve().parent.parent / "data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)
STORE_PATH = DATA_DIR / "meal_planner_store.json"
_LOCK = Lock()
_DEFAULT_STORE: dict[str, Any] = {"preferences": None, "day_plans": {}, "favorites": []}


def _load() -> dict[str, Any]:
    if not STORE_PATH.exists():
        return json.loads(json.dumps(_DEFAULT_STORE))
    return json.loads(STORE_PATH.read_text())


def _save(store: dict[str, Any]) -> None:
    STORE_PATH.write_text(json.dumps(store, indent=2, sort_keys=True))


def read_store() -> dict[str, Any]:
    with _LOCK:
        return _load()


def update_store(mutator: Callable[[dict[str, Any]], Any]) -> Any:
    with _LOCK:
        store = _load()
        result = mutator(store)
        _save(store)
        return result
