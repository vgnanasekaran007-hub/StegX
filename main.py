"""
StegX 3D Universal Steganography Studio
Root Entry Point for Render & Production Deployments.

This file ensures uvicorn can start StegX from the repository root.
Render Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
"""
import os
import sys

# ------------------------------------------------------------------
# Path resolution: make sure Python can find all backend modules
# regardless of how uvicorn is launched.
# ------------------------------------------------------------------
_root = os.path.dirname(os.path.abspath(__file__))
_backend = os.path.join(_root, "backend")

# Insert backend dir FIRST so `config`, `database`, `routes`, `engines`,
# `analyzers` all resolve as top-level imports (matching how the code
# was written inside backend/).
for p in [_backend, _root]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Change working directory into backend/ so relative paths like
# UPLOAD_DIR = Path(__file__).parent / "uploads" resolve correctly.
os.chdir(_backend)

# ------------------------------------------------------------------
# Import the FastAPI app — the backend.main module already adds its
# own directory to sys.path, so this import is safe.
# ------------------------------------------------------------------
from backend.main import app  # noqa: E402, F401

# ------------------------------------------------------------------
# Allow `python main.py` to start the server directly.
# ------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
