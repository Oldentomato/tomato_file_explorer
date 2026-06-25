import mimetypes
import secrets
import shutil
import time
from pathlib import Path
from threading import Lock
from typing import List

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel


ROOT_DIR = Path("/data").resolve()

app = FastAPI(title="File Explorer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Entry(BaseModel):
    name: str
    path: str
    is_dir: bool
    size: int


class DirectoryListing(BaseModel):
    current_path: str
    entries: List[Entry]


class ShareLinkResponse(BaseModel):
    token: str
    expires_at: int
    expires_in: int
    download_path: str


SHARE_TTL_SECONDS = 300
_share_links: dict[str, tuple[str, float]] = {}
_share_lock = Lock()


def safe_target_path(relative_path: str) -> Path:
    target = (ROOT_DIR / relative_path).resolve()
    if ROOT_DIR not in [target, *target.parents]:
        raise HTTPException(status_code=400, detail="Invalid path")
    return target


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/list", response_model=DirectoryListing)
def list_directory(path: str = Query(default="", description="Relative path under /data")) -> DirectoryListing:
    target = safe_target_path(path)

    if not target.exists():
        raise HTTPException(status_code=404, detail="Path not found")
    if not target.is_dir():
        raise HTTPException(status_code=400, detail="Path is not a directory")

    entries: list[Entry] = []
    for item in sorted(target.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower())):
        entries.append(
            Entry(
                name=item.name,
                path=str(item.relative_to(ROOT_DIR)),
                is_dir=item.is_dir(),
                size=item.stat().st_size if item.is_file() else 0,
            )
        )

    return DirectoryListing(
        current_path=str(target.relative_to(ROOT_DIR)),
        entries=entries,
    )


@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    path: str = Query(default="", description="Relative directory path under /data"),
) -> dict:
    target_dir = safe_target_path(path)
    if not target_dir.exists():
        raise HTTPException(status_code=404, detail="Path not found")
    if not target_dir.is_dir():
        raise HTTPException(status_code=400, detail="Path is not a directory")

    filename = Path(file.filename or "").name
    if not filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    destination = target_dir / filename
    content = await file.read()
    destination.write_bytes(content)

    return {"message": "uploaded", "path": str(destination.relative_to(ROOT_DIR))}


def guess_media_type(file_path: Path) -> str:
    mime, _ = mimetypes.guess_type(str(file_path))
    return mime or "application/octet-stream"


def _cleanup_expired_shares() -> None:
    now = time.time()
    expired = [token for token, (_, expires_at) in _share_links.items() if expires_at <= now]
    for token in expired:
        del _share_links[token]


def _resolve_share_token(token: str) -> str:
    with _share_lock:
        _cleanup_expired_shares()
        record = _share_links.get(token)
        if not record:
            raise HTTPException(status_code=404, detail="Link expired or not found")
        path, expires_at = record
        if time.time() > expires_at:
            del _share_links[token]
            raise HTTPException(status_code=404, detail="Link expired or not found")
        return path


def _file_response(target: Path, *, inline: bool = False) -> FileResponse:
    media_type = guess_media_type(target)
    disposition = "inline" if inline else "attachment"
    return FileResponse(
        path=str(target),
        filename=target.name,
        media_type=media_type,
        content_disposition_type=disposition,
    )


@app.get("/api/download")
def download_file(
    path: str = Query(..., description="Relative file path under /data"),
    inline: bool = Query(False, description="Use inline disposition for browser preview"),
) -> FileResponse:
    target = safe_target_path(path)
    if not target.exists():
        raise HTTPException(status_code=404, detail="Path not found")
    if not target.is_file():
        raise HTTPException(status_code=400, detail="Path is not a file")

    return _file_response(target, inline=inline)


@app.post("/api/share", response_model=ShareLinkResponse)
def create_share_link(
    path: str = Query(..., description="Relative file path under /data"),
) -> ShareLinkResponse:
    target = safe_target_path(path)
    if not target.exists():
        raise HTTPException(status_code=404, detail="Path not found")
    if not target.is_file():
        raise HTTPException(status_code=400, detail="Path is not a file")

    token = secrets.token_urlsafe(32)
    expires_at = time.time() + SHARE_TTL_SECONDS
    relative_path = str(target.relative_to(ROOT_DIR))

    with _share_lock:
        _cleanup_expired_shares()
        _share_links[token] = (relative_path, expires_at)

    return ShareLinkResponse(
        token=token,
        expires_at=int(expires_at),
        expires_in=SHARE_TTL_SECONDS,
        download_path=f"/api/shared/{token}",
    )


@app.get("/api/shared/{token}")
def download_shared_file(token: str) -> FileResponse:
    relative_path = _resolve_share_token(token)
    target = safe_target_path(relative_path)
    if not target.exists():
        raise HTTPException(status_code=404, detail="Path not found")
    if not target.is_file():
        raise HTTPException(status_code=400, detail="Path is not a file")

    return _file_response(target, inline=False)


@app.delete("/api/delete")
def delete_path(path: str = Query(..., description="Relative file or directory path under /data")) -> dict:
    target = safe_target_path(path)
    if target == ROOT_DIR:
        raise HTTPException(status_code=400, detail="Cannot delete storage root")
    if not target.exists():
        raise HTTPException(status_code=404, detail="Path not found")

    rel = str(target.relative_to(ROOT_DIR))
    if target.is_dir():
        shutil.rmtree(target)
    else:
        target.unlink()

    return {"message": "deleted", "path": rel}
