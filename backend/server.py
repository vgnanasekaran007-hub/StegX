"""
StegX Server Entry Point — New file with API Key Middleware.

Run this instead of main.py directly:
    python server.py

On first run, generates a random API key and saves it to .env.
All /api/* endpoints (except /api/health and /health) require
the X-API-Key header to match STEGX_API_KEY.
"""
import os
import sys
import secrets
import string
from pathlib import Path

# Ensure backend dir is in path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# ── .env bootstrap ─────────────────────────────────────────────
ENV_FILE = Path(backend_dir) / ".env"


def _generate_api_key(length: int = 48) -> str:
    """Generate a cryptographically random API key."""
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _ensure_env_file():
    """Create .env with a fresh STEGX_API_KEY if it doesn't exist."""
    if ENV_FILE.exists():
        # Check if STEGX_API_KEY is already set
        content = ENV_FILE.read_text()
        if "STEGX_API_KEY" in content:
            return
        # Append it
        key = _generate_api_key()
        with open(ENV_FILE, "a") as f:
            f.write(f"\nSTEGX_API_KEY={key}\n")
        print(f"✦ Generated API key and appended to {ENV_FILE}")
        return

    # Create new .env
    key = _generate_api_key()
    ENV_FILE.write_text(
        "# StegX Backend Environment Variables\n"
        "# This file is auto-generated. Keep it secret!\n"
        f"STEGX_API_KEY={key}\n"
    )
    print(f"✦ Created {ENV_FILE} with a fresh API key")


def _load_env():
    """Simple .env loader — no external dependency required."""
    if not ENV_FILE.exists():
        return
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


# Bootstrap .env first, then load it
_ensure_env_file()
_load_env()

# ── Now import the FastAPI app ─────────────────────────────────
from fastapi import Request
from fastapi.responses import JSONResponse
from main import app  # noqa: E402  (import after sys.path fix)


# ── API Key Middleware ─────────────────────────────────────────
API_KEY = os.environ.get("STEGX_API_KEY", "")

# Paths that are exempt from authentication
PUBLIC_PATHS = {"/api/health", "/health", "/docs", "/openapi.json", "/redoc"}


@app.middleware("http")
async def api_key_middleware(request: Request, call_next):
    """Verify X-API-Key header on all /api/* requests (except health)."""
    path = request.url.path

    # Skip auth for public paths, static files, and non-API routes
    if (
        path in PUBLIC_PATHS
        or not path.startswith("/api")
        or not API_KEY  # If no key configured, skip auth
    ):
        return await call_next(request)

    # Check header
    provided_key = request.headers.get("X-API-Key", "")
    if provided_key != API_KEY:
        return JSONResponse(
            status_code=401,
            content={"detail": "Invalid or missing API key. Send X-API-Key header."},
        )

    return await call_next(request)


# ── Startup Banner ─────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))

    print()
    print("╔══════════════════════════════════════════════════════╗")
    print("║        StegX 3D Steganography Studio — Server       ║")
    print("╠══════════════════════════════════════════════════════╣")
    if API_KEY:
        # Show first 8 chars, mask the rest
        masked = API_KEY[:8] + "…" + API_KEY[-4:]
        print(f"║  API Key : {masked:<41} ║")
        print(f"║  Full key in: backend/.env                          ║")
    else:
        print("║  API Key : (none — auth disabled)                    ║")
    print(f"║  Port    : {port:<41} ║")
    print("╚══════════════════════════════════════════════════════╝")
    print()

    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
