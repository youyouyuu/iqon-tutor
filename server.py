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
DATA_DIR = BASE_DIR / "data"
DATABASE_PATH = DATA_DIR / "brightpath.db"
HOST = os.getenv("APP_HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", os.getenv("APP_PORT", "8000")))
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "change-me")
PHONE_PATTERN = re.compile(r"^[0-9+\-\s]{8,20}$")


def utc_now() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def ensure_storage() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    with sqlite3.connect(DATABASE_PATH) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS inquiries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                level TEXT NOT NULL,
                subject TEXT NOT NULL,
                phone TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        connection.commit()


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def is_valid_phone(value: str) -> bool:
    return bool(PHONE_PATTERN.fullmatch(value.strip()))


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

        if path != "/api/contact":
            self.respond_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "Endpoint not found"})
            return

        payload = self.read_json_body()
        if payload is None:
            return

        name = str(payload.get("name", "")).strip()
        level = str(payload.get("level", "")).strip()
        subject = str(payload.get("subject", "")).strip()
        phone = str(payload.get("phone", "")).strip()
        message = str(payload.get("message", "")).strip()

        validation_error = self.validate_contact_payload(name, level, subject, phone, message)
        if validation_error:
            self.respond_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": validation_error})
            return

        with get_connection() as connection:
            connection.execute(
                """
                INSERT INTO inquiries (name, level, subject, phone, message, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (name, level, subject, phone, message, utc_now()),
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
                SELECT id, name, level, subject, phone, message, created_at
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
        message: str,
    ) -> str | None:
        if len(name) < 2:
            return "กรุณากรอกชื่อผู้ติดต่อให้ครบถ้วน"
        if not level:
            return "กรุณาเลือกระดับชั้น"
        if not subject:
            return "กรุณาเลือกรายวิชา"
        if not is_valid_phone(phone):
            return "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง"
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
        self.send_header("WWW-Authenticate", 'Basic realm="BrightPath Admin"')
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
