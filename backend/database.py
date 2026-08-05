"""
StegX Database — SQLite async database for operation history and settings.
"""
import aiosqlite
import json
from datetime import datetime
from config import DB_PATH


async def init_db():
    """Initialize database tables."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS operations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                operation_type TEXT NOT NULL,
                algorithm TEXT,
                cover_file TEXT,
                secret_file TEXT,
                output_file TEXT,
                encryption TEXT,
                file_type TEXT,
                cover_type TEXT,
                status TEXT DEFAULT 'completed',
                quality_metrics TEXT,
                timestamp TEXT DEFAULT (datetime('now')),
                details TEXT
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                filepath TEXT NOT NULL,
                file_type TEXT,
                mime_type TEXT,
                size_bytes INTEGER,
                hash_sha256 TEXT,
                metadata TEXT,
                uploaded_at TEXT DEFAULT (datetime('now'))
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)
        # Insert default settings
        defaults = {
            "theme": "cyberpunk",
            "language": "en",
            "gpu_acceleration": "true",
            "performance": "high",
            "animation_speed": "1.0"
        }
        for key, value in defaults.items():
            await db.execute(
                "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
                (key, value)
            )
        await db.commit()


async def add_operation(operation_type, algorithm=None, cover_file=None,
                        secret_file=None, output_file=None, encryption=None,
                        file_type=None, cover_type=None, status="completed",
                        quality_metrics=None, details=None):
    """Record an operation in history."""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """INSERT INTO operations
            (operation_type, algorithm, cover_file, secret_file, output_file,
             encryption, file_type, cover_type, status, quality_metrics, details)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (operation_type, algorithm, cover_file, secret_file, output_file,
             encryption, file_type, cover_type, status,
             json.dumps(quality_metrics) if quality_metrics else None,
             json.dumps(details) if details else None)
        )
        await db.commit()
        return cursor.lastrowid


async def get_operations(limit=50, offset=0, operation_type=None, search=None):
    """Retrieve operation history with optional filters."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        query = "SELECT * FROM operations WHERE 1=1"
        params = []
        if operation_type:
            query += " AND operation_type = ?"
            params.append(operation_type)
        if search:
            query += " AND (cover_file LIKE ? OR secret_file LIKE ? OR output_file LIKE ?)"
            params.extend([f"%{search}%"] * 3)
        query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


async def get_operation_count(operation_type=None):
    """Get total count of operations."""
    async with aiosqlite.connect(DB_PATH) as db:
        query = "SELECT COUNT(*) FROM operations"
        params = []
        if operation_type:
            query += " WHERE operation_type = ?"
            params.append(operation_type)
        cursor = await db.execute(query, params)
        row = await cursor.fetchone()
        return row[0]


async def delete_operation(op_id):
    """Delete an operation from history."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM operations WHERE id = ?", (op_id,))
        await db.commit()


async def add_file_record(filename, filepath, file_type, mime_type, size_bytes, hash_sha256, metadata=None):
    """Record a file in the database."""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """INSERT INTO files (filename, filepath, file_type, mime_type, size_bytes, hash_sha256, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (filename, filepath, file_type, mime_type, size_bytes, hash_sha256,
             json.dumps(metadata) if metadata else None)
        )
        await db.commit()
        return cursor.lastrowid


async def get_settings():
    """Get all settings."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM settings")
        rows = await cursor.fetchall()
        return {row["key"]: row["value"] for row in rows}


async def update_setting(key, value):
    """Update a setting."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
            (key, value)
        )
        await db.commit()
