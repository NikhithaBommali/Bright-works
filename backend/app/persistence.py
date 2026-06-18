import json
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
PREFERENCES_FILE = DATA_DIR / "preferences.json"
PLANS_FILE = DATA_DIR / "plans.json"
FAVORITES_FILE = DATA_DIR / "favorites.json"


def _ensure_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def load_json(path: Path, default: Any) -> Any:
    _ensure_dir()
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def save_json(path: Path, data: Any) -> None:
    _ensure_dir()
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")
