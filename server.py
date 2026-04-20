from __future__ import annotations

import base64
import json
import os
import re
import sqlite3
from datetime import datetime
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DATA_DIR = Path("/var/data") if Path("/var/data").exists() else BASE_DIR / "data"
DATA_DIR = Path(os.getenv("DATA_DIR", str(DEFAULT_DATA_DIR))).resolve()
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", str(DATA_DIR / "brightpath.db"))).resolve()
HOST = os.getenv("APP_HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", os.getenv("APP_PORT", "8000")))
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "change-me")
PHONE_PATTERN = re.compile(r"^0\d{9}$")


def utc_now() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def ensure_storage() -> None:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DATABASE_PATH) as connection:
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
        connection.commit()


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def normalize_phone(value: str) -> str:
    return re.sub(r"\D", "", value or "")


def is_valid_phone(value: str) -> bool:
    return bool(PHONE_PATTERN.fullmatch(normalize_phone(value)))


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
        path = urlparse(self.path).path

        if path == "/api/health":
            self.respond_json(HTTPStatus.OK, {"ok": True, "status": "healthy", "time": utc_now()})
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

        if path == "/admin":
            self.path = "/admin.html"

        super().do_GET()

    def do_POST(self) -> None:  # noqa: N802
        path = urlparse(self.path).path

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
            connection.execute(
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
                    int(consent_contact),
                    int(consent_terms),
                    message,
                    utc_now(),
                ),
            )
            connection.commit()

        self.respond_json(HTTPStatus.OK, {"ok": True, "message": "Inquiry saved"})

    def handle_admin_stats(self) -> None:
        with get_connection() as connection:
            total = connection.execute("SELECT COUNT(*) AS total FROM inquiries").fetchone()["total"]
            latest = connection.execute(
                "SELECT created_at FROM inquiries ORDER BY id DESC LIMIT 1"
            ).fetchone()
            today = connection.execute(
                "SELECT COUNT(*) AS total FROM inquiries WHERE substr(created_at, 1, 10) = ?",
                (datetime.utcnow().strftime("%Y-%m-%d"),),
            ).fetchone()["total"]

        self.respond_json(
            HTTPStatus.OK,
            {
                "ok": True,
                "stats": {
                    "total_inquiries": total,
                    "today_inquiries": today,
                    "latest_inquiry_at": latest["created_at"] if latest else None,
                },
            },
        )

    def handle_admin_inquiries(self) -> None:
        with get_connection() as connection:
            rows = connection.execute(
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
            ).fetchall()

        self.respond_json(HTTPStatus.OK, {"ok": True, "inquiries": [dict(row) for row in rows]})

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

    def respond_json(self, status: HTTPStatus, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    ensure_storage()
    server = ThreadingHTTPServer((HOST, PORT), AppHandler)
    print(f"Serving BrightPath Academy at http://{HOST}:{PORT}")
    print("Admin credentials are controlled by ADMIN_USERNAME and ADMIN_PASSWORD.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        server.server_close()
