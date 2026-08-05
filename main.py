"""
StegX 3D Universal Steganography Studio — Root Entry Point for Render & Production Deployments.
"""
import os
import sys

# Add backend directory to sys.path so all imports resolve seamlessly
root_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(root_dir, "backend")

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

# Set working directory to backend so relative file paths resolve correctly
os.chdir(backend_dir)

# Import the FastAPI app from backend.main
from backend.main import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
