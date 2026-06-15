import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"

sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(BACKEND_DIR))
