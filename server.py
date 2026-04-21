from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import uuid
from datetime import date, datetime, timedelta
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError:  # pragma: no cover - handled at runtime on deploy
    psycopg = None
    dict_row = None


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DATA_DIR = Path("/var/data") if Path("/var/data").exists() else BASE_DIR / "data"
DATA_DIR = Path(os.getenv("DATA_DIR", str(DEFAULT_DATA_DIR))).resolve()
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", str(DATA_DIR / "brightpath.db"))).resolve()
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
USE_POSTGRES = bool(DATABASE_URL)
HOST = os.getenv("APP_HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", os.getenv("APP_PORT", "8000")))
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "change-me")
PHONE_PATTERN = re.compile(r"^0\d{9}$")
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
CHAT_MESSAGE_LIMIT = 800
PASSWORD_MIN_LENGTH = 8
SESSION_COOKIE_NAME = "iqon_session"
SESSION_DURATION = timedelta(days=30)


def utc_now() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def adapt_query(query: str) -> str:
    if USE_POSTGRES:
        return query.replace("?", "%s")
    return query


def row_to_dict(row: Any) -> dict[str, Any]:
    if row is None:
        return {}
    if isinstance(row, dict):
        return row
    return dict(row)


def row_value(row: Any, key: str, default: Any = None) -> Any:
    if row is None:
        return default
    if isinstance(row, dict):
        return row.get(key, default)
    try:
        return row[key]
    except Exception:
        return default


def db_bool(value: bool) -> bool | int:
    if USE_POSTGRES:
        return bool(value)
    return int(bool(value))


def json_default(value: Any) -> Any:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


def normalize_email(value: str) -> str:
    return str(value or "").strip().lower()


def is_valid_email(value: str) -> bool:
    return bool(EMAIL_PATTERN.fullmatch(normalize_email(value)))


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 390000)
    return f"pbkdf2_sha256${salt.hex()}${digest.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, salt_hex, digest_hex = password_hash.split("$", 2)
        if algorithm != "pbkdf2_sha256":
            return False
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(digest_hex)
    except Exception:
        return False

    calculated = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 390000)
    return hmac.compare_digest(calculated, expected)


def build_session_expiry() -> str:
    return (datetime.utcnow() + SESSION_DURATION).replace(microsecond=0).isoformat() + "Z"


def should_use_secure_cookie() -> bool:
    if os.getenv("COOKIE_SECURE", "").lower() in {"0", "false", "no"}:
        return False
    return bool(os.getenv("RENDER")) or os.getenv("APP_ENV", "").lower() == "production"


def make_session_cookie(session_id: str) -> str:
    parts = [
        f"{SESSION_COOKIE_NAME}={session_id}",
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        f"Max-Age={int(SESSION_DURATION.total_seconds())}",
    ]
    if should_use_secure_cookie():
        parts.append("Secure")
    return "; ".join(parts)


def clear_session_cookie() -> str:
    parts = [
        f"{SESSION_COOKIE_NAME}=",
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        "Max-Age=0",
    ]
    if should_use_secure_cookie():
        parts.append("Secure")
    return "; ".join(parts)


def parse_cookies(header: str) -> dict[str, str]:
    cookies: dict[str, str] = {}
    for part in str(header or "").split(";"):
        if "=" not in part:
            continue
        key, value = part.split("=", 1)
        cookies[key.strip()] = value.strip()
    return cookies


def create_chat_session(connection: Any, user_id: int) -> str:
    session_id = secrets.token_urlsafe(32)
    execute_query(
        connection,
        """
        INSERT INTO chat_sessions (id, user_id, created_at, expires_at)
        VALUES (?, ?, ?, ?)
        """,
        (session_id, user_id, utc_now(), build_session_expiry()),
    )
    return session_id


def execute_query(connection: Any, query: str, params: tuple[Any, ...] = ()) -> Any:
    return connection.execute(adapt_query(query), params)


def fetchone(connection: Any, query: str, params: tuple[Any, ...] = ()) -> Any:
    return execute_query(connection, query, params).fetchone()


def fetchall(connection: Any, query: str, params: tuple[Any, ...] = ()) -> list[Any]:
    return execute_query(connection, query, params).fetchall()


def ensure_storage() -> None:
    if USE_POSTGRES:
        if psycopg is None or dict_row is None:
            raise RuntimeError(
                "DATABASE_URL is set but psycopg is not installed. Add psycopg[binary] to requirements.txt."
            )

        with psycopg.connect(DATABASE_URL, autocommit=True, row_factory=dict_row) as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS chat_users (
                    id BIGSERIAL PRIMARY KEY,
                    full_name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS chat_sessions (
                    id TEXT PRIMARY KEY,
                    user_id BIGINT NOT NULL REFERENCES chat_users(id) ON DELETE CASCADE,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    expires_at TIMESTAMPTZ NOT NULL
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS inquiries (
                    id BIGSERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    level TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    preferred_time TEXT NOT NULL DEFAULT '',
                    consent_contact BOOLEAN NOT NULL DEFAULT FALSE,
                    consent_terms BOOLEAN NOT NULL DEFAULT FALSE,
                    message TEXT NOT NULL DEFAULT '',
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS chat_conversations (
                    id TEXT PRIMARY KEY,
                    user_id BIGINT REFERENCES chat_users(id) ON DELETE CASCADE,
                    source_page TEXT NOT NULL DEFAULT '',
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id BIGSERIAL PRIMARY KEY,
                    conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
                    sender TEXT NOT NULL,
                    message TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
            connection.execute(
                """
                ALTER TABLE chat_conversations
                ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES chat_users(id) ON DELETE CASCADE
                """
            )
        return

    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DATABASE_PATH) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS chat_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES chat_users(id) ON DELETE CASCADE
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS inquiries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                level TEXT NOT NULL,
                subject TEXT NOT NULL,
                phone TEXT NOT NULL,
                preferred_time TEXT NOT NULL DEFAULT '',
                consent_contact INTEGER NOT NULL DEFAULT 0,
                consent_terms INTEGER NOT NULL DEFAULT 0,
                message TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS chat_conversations (
                id TEXT PRIMARY KEY,
                user_id INTEGER,
                source_page TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS chat_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id TEXT NOT NULL,
                sender TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
            )
            """
        )
        columns = {
            row[1]
            for row in connection.execute("PRAGMA table_info(inquiries)").fetchall()
        }
        if "preferred_time" not in columns:
            connection.execute(
                "ALTER TABLE inquiries ADD COLUMN preferred_time TEXT NOT NULL DEFAULT ''"
            )
        if "consent_contact" not in columns:
            connection.execute(
                "ALTER TABLE inquiries ADD COLUMN consent_contact INTEGER NOT NULL DEFAULT 0"
            )
        if "consent_terms" not in columns:
            connection.execute(
                "ALTER TABLE inquiries ADD COLUMN consent_terms INTEGER NOT NULL DEFAULT 0"
            )
        conversation_columns = {
            row[1]
            for row in connection.execute("PRAGMA table_info(chat_conversations)").fetchall()
        }
        if "user_id" not in conversation_columns:
            connection.execute("ALTER TABLE chat_conversations ADD COLUMN user_id INTEGER")
        connection.commit()


def get_connection() -> Any:
    if USE_POSTGRES:
        if psycopg is None or dict_row is None:
            raise RuntimeError(
                "DATABASE_URL is set but psycopg is not installed. Add psycopg[binary] to requirements.txt."
            )
        return psycopg.connect(DATABASE_URL, row_factory=dict_row)

    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def normalize_phone(value: str) -> str:
    return re.sub(r"\D", "", value or "")


def is_valid_phone(value: str) -> bool:
    return bool(PHONE_PATTERN.fullmatch(normalize_phone(value)))


def is_valid_conversation_id(value: str) -> bool:
    return bool(re.fullmatch(r"[A-Za-z0-9_-]{8,80}", value or ""))


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == "/api/health":
            self.respond_json(HTTPStatus.OK, {"ok": True, "status": "healthy", "time": utc_now()})
            return

        if path == "/api/auth/me":
            self.handle_auth_me()
            return

        if path == "/api/chat/messages":
            conversation_id = str(query.get("conversation_id", [""])[0]).strip()
            if not is_valid_conversation_id(conversation_id):
                self.respond_json(
                    HTTPStatus.BAD_REQUEST,
                    {"ok": False, "error": "Invalid conversation id"},
                )
                return
            self.handle_public_chat_messages(conversation_id)
            return

        if path == "/api/admin/stats":
            if not self.require_admin_auth():
                return
            self.handle_admin_stats()
            return

        if path == "/api/admin/inquiries":
            if not self.require_admin_auth():
                return
            self.handle_admin_inquiries()
            return

        if path == "/api/admin/chat/conversations":
            if not self.require_admin_auth():
                return
            self.handle_admin_chat_conversations()
            return

        if path == "/api/admin/chat/messages":
            if not self.require_admin_auth():
                return
            conversation_id = str(query.get("conversation_id", [""])[0]).strip()
            if not is_valid_conversation_id(conversation_id):
                self.respond_json(
                    HTTPStatus.BAD_REQUEST,
                    {"ok": False, "error": "Invalid conversation id"},
                )
                return
            self.handle_admin_chat_messages(conversation_id)
            return

        if path == "/admin":
            self.path = "/admin.html"

        super().do_GET()

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/auth/register":
            payload = self.read_json_body()
            if payload is None:
                return
            self.handle_auth_register(payload)
            return

        if path == "/api/auth/login":
            payload = self.read_json_body()
            if payload is None:
                return
            self.handle_auth_login(payload)
            return

        if path == "/api/auth/logout":
            self.handle_auth_logout()
            return

        if path == "/api/admin/login":
            payload = self.read_json_body()
            if payload is None:
                return

            username = str(payload.get("username", "")).strip()
            password = str(payload.get("password", ""))

            if username != ADMIN_USERNAME or password != ADMIN_PASSWORD:
                self.respond_json(HTTPStatus.UNAUTHORIZED, {"ok": False, "error": "Unauthorized"})
                return

            self.respond_json(HTTPStatus.OK, {"ok": True, "message": "Login successful"})
            return

        if path == "/api/chat/messages":
            payload = self.read_json_body()
            if payload is None:
                return
            self.handle_public_chat_send(payload)
            return

        if path == "/api/admin/chat/messages":
            if not self.require_admin_auth():
                return
            payload = self.read_json_body()
            if payload is None:
                return
            self.handle_admin_chat_send(payload)
            return

        if path != "/api/contact":
            self.respond_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "Endpoint not found"})
            return

        payload = self.read_json_body()
        if payload is None:
            return

        name = str(payload.get("name", "")).strip()
        level = str(payload.get("level", "")).strip()
        subject = str(payload.get("subject", "")).strip()
        phone = normalize_phone(str(payload.get("phone", "")))
        preferred_time = str(payload.get("preferred_time", "")).strip()
        consent_contact = bool(payload.get("consent_contact"))
        consent_terms = bool(payload.get("consent_terms"))
        message = str(payload.get("message", "")).strip()

        validation_error = self.validate_contact_payload(
            name,
            level,
            subject,
            phone,
            preferred_time,
            consent_contact,
            consent_terms,
            message,
        )
        if validation_error:
            self.respond_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": validation_error})
            return

        with get_connection() as connection:
            execute_query(
                connection,
                """
                INSERT INTO inquiries (
                    name,
                    level,
                    subject,
                    phone,
                    preferred_time,
                    consent_contact,
                    consent_terms,
                    message,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    name,
                    level,
                    subject,
                    phone,
                    preferred_time,
                    db_bool(consent_contact),
                    db_bool(consent_terms),
                    message,
                    utc_now(),
                ),
            )
            connection.commit()

        self.respond_json(HTTPStatus.OK, {"ok": True, "message": "Inquiry saved"})

    def get_session_id(self) -> str:
        cookies = parse_cookies(self.headers.get("Cookie", ""))
        return str(cookies.get(SESSION_COOKIE_NAME, "")).strip()

    def get_authenticated_user(self, connection: Any) -> Any:
        session_id = self.get_session_id()
        if not session_id:
            return None

        if USE_POSTGRES:
            return fetchone(
                connection,
                """
                SELECT u.id, u.full_name, u.email
                FROM chat_sessions s
                JOIN chat_users u ON u.id = s.user_id
                WHERE s.id = ? AND s.expires_at > NOW()
                """,
                (session_id,),
            )

        return fetchone(
            connection,
            """
            SELECT u.id, u.full_name, u.email
            FROM chat_sessions s
            JOIN chat_users u ON u.id = s.user_id
            WHERE s.id = ? AND s.expires_at > ?
            """,
            (session_id, utc_now()),
        )

    def require_chat_auth(self, connection: Any) -> Any:
        user = self.get_authenticated_user(connection)
        if user is not None:
            return user

        self.respond_json(
            HTTPStatus.UNAUTHORIZED,
            {"ok": False, "error": "Please sign in before using chat", "auth_required": True},
        )
        return None

    def handle_auth_me(self) -> None:
        with get_connection() as connection:
            user = self.get_authenticated_user(connection)

        if user is None:
            self.respond_json(HTTPStatus.OK, {"ok": True, "authenticated": False, "user": None})
            return

        self.respond_json(
            HTTPStatus.OK,
            {"ok": True, "authenticated": True, "user": row_to_dict(user)},
        )

    def handle_auth_register(self, payload: dict[str, Any]) -> None:
        full_name = str(payload.get("full_name", "")).strip()
        email = normalize_email(payload.get("email", ""))
        password = str(payload.get("password", ""))

        if len(full_name) < 2:
            self.respond_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "Please enter your name"})
            return
        if not is_valid_email(email):
            self.respond_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "Please enter a valid email"})
            return
        if len(password) < PASSWORD_MIN_LENGTH:
            self.respond_json(
                HTTPStatus.BAD_REQUEST,
                {"ok": False, "error": f"Password must be at least {PASSWORD_MIN_LENGTH} characters"},
            )
            return

        password_hash = hash_password(password)
        with get_connection() as connection:
            existing = fetchone(
                connection,
                "SELECT id FROM chat_users WHERE email = ?",
                (email,),
            )
            if existing is not None:
                self.respond_json(
                    HTTPStatus.CONFLICT,
                    {"ok": False, "error": "This email is already registered"},
                )
                return

            execute_query(
                connection,
                """
                INSERT INTO chat_users (full_name, email, password_hash, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (full_name, email, password_hash, utc_now()),
            )
            user = fetchone(
                connection,
                "SELECT id, full_name, email FROM chat_users WHERE email = ?",
                (email,),
            )
            session_id = create_chat_session(connection, int(row_value(user, "id", 0)))
            connection.commit()

        self.respond_json(
            HTTPStatus.CREATED,
            {"ok": True, "user": row_to_dict(user), "message": "Registration successful"},
            extra_headers=[("Set-Cookie", make_session_cookie(session_id))],
        )

    def handle_auth_login(self, payload: dict[str, Any]) -> None:
        email = normalize_email(payload.get("email", ""))
        password = str(payload.get("password", ""))

        if not is_valid_email(email) or not password:
            self.respond_json(
                HTTPStatus.BAD_REQUEST,
                {"ok": False, "error": "Please enter your email and password"},
            )
            return

        with get_connection() as connection:
            user = fetchone(
                connection,
                "SELECT id, full_name, email, password_hash FROM chat_users WHERE email = ?",
                (email,),
            )
            if user is None or not verify_password(password, str(row_value(user, "password_hash", ""))):
                self.respond_json(
                    HTTPStatus.UNAUTHORIZED,
                    {"ok": False, "error": "Invalid email or password"},
                )
                return

            session_id = create_chat_session(connection, int(row_value(user, "id", 0)))
            connection.commit()

        self.respond_json(
            HTTPStatus.OK,
            {
                "ok": True,
                "user": {
                    "id": row_value(user, "id"),
                    "full_name": row_value(user, "full_name"),
                    "email": row_value(user, "email"),
                },
                "message": "Login successful",
            },
            extra_headers=[("Set-Cookie", make_session_cookie(session_id))],
        )

    def handle_auth_logout(self) -> None:
        session_id = self.get_session_id()
        if session_id:
            with get_connection() as connection:
                execute_query(connection, "DELETE FROM chat_sessions WHERE id = ?", (session_id,))
                connection.commit()

        self.respond_json(
            HTTPStatus.OK,
            {"ok": True, "message": "Logged out"},
            extra_headers=[("Set-Cookie", clear_session_cookie())],
        )

    def handle_admin_stats(self) -> None:
        with get_connection() as connection:
            total = row_value(fetchone(connection, "SELECT COUNT(*) AS total FROM inquiries"), "total", 0)
            latest = fetchone(connection, "SELECT created_at FROM inquiries ORDER BY id DESC LIMIT 1")
            if USE_POSTGRES:
                today = row_value(
                    fetchone(
                        connection,
                        "SELECT COUNT(*) AS total FROM inquiries WHERE DATE(created_at AT TIME ZONE 'UTC') = %s",
                        (datetime.utcnow().strftime("%Y-%m-%d"),),
                    ),
                    "total",
                    0,
                )
            else:
                today = row_value(
                    fetchone(
                        connection,
                        "SELECT COUNT(*) AS total FROM inquiries WHERE substr(created_at, 1, 10) = ?",
                        (datetime.utcnow().strftime("%Y-%m-%d"),),
                    ),
                    "total",
                    0,
                )
            open_chats = row_value(
                fetchone(connection, "SELECT COUNT(*) AS total FROM chat_conversations"),
                "total",
                0,
            )

        self.respond_json(
            HTTPStatus.OK,
            {
                "ok": True,
                "stats": {
                    "total_inquiries": total,
                    "today_inquiries": today,
                    "latest_inquiry_at": row_value(latest, "created_at"),
                    "chat_conversations": open_chats,
                },
            },
        )

    def handle_admin_inquiries(self) -> None:
        with get_connection() as connection:
            rows = fetchall(
                connection,
                """
                SELECT
                    id,
                    name,
                    level,
                    subject,
                    phone,
                    preferred_time,
                    consent_contact,
                    consent_terms,
                    message,
                    created_at
                FROM inquiries
                ORDER BY id DESC
                LIMIT 100
                """
            )

        self.respond_json(HTTPStatus.OK, {"ok": True, "inquiries": [row_to_dict(row) for row in rows]})

    def handle_public_chat_messages(self, conversation_id: str) -> None:
        with get_connection() as connection:
            user = self.require_chat_auth(connection)
            if user is None:
                return

            conversation = fetchone(
                connection,
                """
                SELECT id, user_id, source_page, created_at, updated_at
                FROM chat_conversations
                WHERE id = ? AND user_id = ?
                """,
                (conversation_id, row_value(user, "id")),
            )
            if conversation is None:
                self.respond_json(
                    HTTPStatus.OK,
                    {"ok": True, "conversation": None, "messages": []},
                )
                return

            rows = fetchall(
                connection,
                """
                SELECT id, sender, message, created_at
                FROM chat_messages
                WHERE conversation_id = ?
                ORDER BY id ASC
                """,
                (conversation_id,),
            )

        self.respond_json(
            HTTPStatus.OK,
            {
                "ok": True,
                "conversation": row_to_dict(conversation),
                "messages": [row_to_dict(row) for row in rows],
            },
        )

    def handle_public_chat_send(self, payload: dict[str, Any]) -> None:
        conversation_id = str(payload.get("conversation_id", "")).strip()
        source_page = str(payload.get("source_page", "")).strip()[:120]
        message = str(payload.get("message", "")).strip()

        if not is_valid_conversation_id(conversation_id):
            self.respond_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "Invalid conversation id"})
            return
        if not message:
            self.respond_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "Message is required"})
            return
        if len(message) > CHAT_MESSAGE_LIMIT:
            self.respond_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "Message is too long"})
            return

        now = utc_now()
        with get_connection() as connection:
            user = self.require_chat_auth(connection)
            if user is None:
                return

            existing = fetchone(
                connection,
                "SELECT id, user_id FROM chat_conversations WHERE id = ?",
                (conversation_id,),
            )
            if existing is None:
                execute_query(
                    connection,
                    """
                    INSERT INTO chat_conversations (id, user_id, source_page, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (conversation_id, row_value(user, "id"), source_page, now, now),
                )
            else:
                existing_user_id = row_value(existing, "user_id")
                if existing_user_id not in (None, row_value(user, "id")):
                    self.respond_json(
                        HTTPStatus.FORBIDDEN,
                        {"ok": False, "error": "This chat room belongs to another user"},
                    )
                    return

                execute_query(
                    connection,
                    """
                    UPDATE chat_conversations
                    SET user_id = ?, source_page = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (row_value(user, "id"), source_page, now, conversation_id),
                )

            execute_query(
                connection,
                """
                INSERT INTO chat_messages (conversation_id, sender, message, created_at)
                VALUES (?, 'user', ?, ?)
                """,
                (conversation_id, message, now),
            )
            connection.commit()

        self.respond_json(
            HTTPStatus.OK,
            {
                "ok": True,
                "conversation_id": conversation_id,
                "message": {
                    "sender": "user",
                    "message": message,
                    "created_at": now,
                },
            },
        )

    def handle_admin_chat_conversations(self) -> None:
        with get_connection() as connection:
            rows = fetchall(
                connection,
                """
                SELECT
                    c.id,
                    c.user_id,
                    c.source_page,
                    c.created_at,
                    c.updated_at,
                    u.full_name AS user_name,
                    u.email AS user_email,
                    (
                        SELECT m.message
                        FROM chat_messages m
                        WHERE m.conversation_id = c.id
                        ORDER BY m.id DESC
                        LIMIT 1
                    ) AS latest_message,
                    (
                        SELECT m.sender
                        FROM chat_messages m
                        WHERE m.conversation_id = c.id
                        ORDER BY m.id DESC
                        LIMIT 1
                    ) AS latest_sender,
                    (
                        SELECT COUNT(*)
                        FROM chat_messages m
                        WHERE m.conversation_id = c.id
                    ) AS message_count
                FROM chat_conversations c
                LEFT JOIN chat_users u ON u.id = c.user_id
                ORDER BY c.updated_at DESC
                LIMIT 100
                """
            )

        self.respond_json(
            HTTPStatus.OK,
            {"ok": True, "conversations": [row_to_dict(row) for row in rows]},
        )

    def handle_admin_chat_messages(self, conversation_id: str) -> None:
        with get_connection() as connection:
            conversation = fetchone(
                connection,
                """
                SELECT
                    chat_conversations.id AS id,
                    chat_conversations.user_id AS user_id,
                    chat_conversations.source_page AS source_page,
                    chat_conversations.created_at AS created_at,
                    chat_conversations.updated_at AS updated_at,
                    u.full_name AS user_name,
                    u.email AS user_email
                FROM chat_conversations
                LEFT JOIN chat_users u ON u.id = chat_conversations.user_id
                WHERE chat_conversations.id = ?
                """,
                (conversation_id,),
            )
            if conversation is None:
                self.respond_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "Conversation not found"})
                return

            rows = fetchall(
                connection,
                """
                SELECT id, sender, message, created_at
                FROM chat_messages
                WHERE conversation_id = ?
                ORDER BY id ASC
                """,
                (conversation_id,),
            )

        self.respond_json(
            HTTPStatus.OK,
            {
                "ok": True,
                "conversation": row_to_dict(conversation),
                "messages": [row_to_dict(row) for row in rows],
            },
        )

    def handle_admin_chat_send(self, payload: dict[str, Any]) -> None:
        conversation_id = str(payload.get("conversation_id", "")).strip()
        message = str(payload.get("message", "")).strip()

        if not is_valid_conversation_id(conversation_id):
            self.respond_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "Invalid conversation id"})
            return
        if not message:
            self.respond_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "Message is required"})
            return
        if len(message) > CHAT_MESSAGE_LIMIT:
            self.respond_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "Message is too long"})
            return

        now = utc_now()
        with get_connection() as connection:
            exists = fetchone(
                connection,
                "SELECT id FROM chat_conversations WHERE id = ?",
                (conversation_id,),
            )
            if exists is None:
                self.respond_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "Conversation not found"})
                return

            execute_query(
                connection,
                """
                INSERT INTO chat_messages (conversation_id, sender, message, created_at)
                VALUES (?, 'admin', ?, ?)
                """,
                (conversation_id, message, now),
            )
            execute_query(
                connection,
                "UPDATE chat_conversations SET updated_at = ? WHERE id = ?",
                (now, conversation_id),
            )
            connection.commit()

        self.respond_json(
            HTTPStatus.OK,
            {
                "ok": True,
                "message": {
                    "sender": "admin",
                    "message": message,
                    "created_at": now,
                },
            },
        )

    def validate_contact_payload(
        self,
        name: str,
        level: str,
        subject: str,
        phone: str,
        preferred_time: str,
        consent_contact: bool,
        consent_terms: bool,
        message: str,
    ) -> str | None:
        if len(name) < 2:
            return "กรุณากรอกชื่อผู้ติดต่อให้ครบถ้วน"
        if not level:
            return "กรุณาเลือกระดับชั้น"
        if not subject:
            return "กรุณาเลือกรายวิชา"
        if not is_valid_phone(phone):
            return "กรุณากรอกเบอร์โทรศัพท์ไทย 10 หลัก"
        if not preferred_time:
            return "กรุณาเลือกเวลาที่สะดวกให้เจ้าหน้าที่ติดต่อกลับ"
        if not consent_contact:
            return "กรุณายินยอมให้สถาบันติดต่อกลับ"
        if not consent_terms:
            return "กรุณายอมรับข้อกำหนดและนโยบายความเป็นส่วนตัว"
        if len(message) > 1000:
            return "ข้อความเพิ่มเติมยาวเกินกำหนด"
        return None

    def read_json_body(self) -> dict[str, Any] | None:
        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length)

        try:
            return json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            self.respond_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "Invalid JSON"})
            return None

    def require_admin_auth(self) -> bool:
        header = self.headers.get("Authorization", "")
        if not header.startswith("Basic "):
            self.request_auth()
            return False

        try:
            decoded = base64.b64decode(header.split(" ", 1)[1]).decode("utf-8")
        except Exception:
            self.request_auth()
            return False

        username, _, password = decoded.partition(":")
        if username != ADMIN_USERNAME or password != ADMIN_PASSWORD:
            self.request_auth()
            return False
        return True

    def request_auth(self) -> None:
        self.send_response(HTTPStatus.UNAUTHORIZED)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps({"ok": False, "error": "Unauthorized"}).encode("utf-8"))

    def respond_json(
        self,
        status: HTTPStatus,
        payload: dict[str, Any],
        extra_headers: list[tuple[str, str]] | None = None,
    ) -> None:
        body = json.dumps(payload, ensure_ascii=False, default=json_default).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        for header_name, header_value in extra_headers or []:
            self.send_header(header_name, header_value)
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    ensure_storage()
    server = ThreadingHTTPServer((HOST, PORT), AppHandler)
    db_label = "Supabase/Postgres" if USE_POSTGRES else f"SQLite ({DATABASE_PATH})"
    print(f"Serving BrightPath Academy at http://{HOST}:{PORT}")
    print(f"Database backend: {db_label}")
    print("Admin credentials are controlled by ADMIN_USERNAME and ADMIN_PASSWORD.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        server.server_close()
