from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

BASE_DIR = Path(os.environ.get("BW_DATA_DIR", Path(__file__).resolve().parent.parent / ".bw_data"))
BASE_DIR.mkdir(parents=True, exist_ok=True)

PREFERENCES_FILE = BASE_DIR / "preferences.json"
PLANS_FILE = BASE_DIR / "plans.json"
FAVORITES_FILE = BASE_DIR / "favorites.json"


def load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError:
        return default


def save_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2))
