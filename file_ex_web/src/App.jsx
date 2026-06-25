import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, ""); //접속한 웹 url기준으로 잡히게됨

const MAX_PREVIEW_TEXT_BYTES = 2 * 1024 * 1024;

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"]);
const VIDEO_EXT = new Set(["mp4", "webm", "ogg", "ogv", "mov"]);

const TEXT_CODE_EXT = new Set([
  "txt",
  "md",
  "markdown",
  "json",
  "jsonl",
  "xml",
  "csv",
  "tsv",
  "log",
  "css",
  "scss",
  "sass",
  "less",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "ts",
  "tsx",
  "vue",
  "svelte",
  "html",
  "htm",
  "xhtml",
  "py",
  "rb",
  "go",
  "rs",
  "java",
  "kt",
  "kts",
  "swift",
  "c",
  "h",
  "cpp",
  "cc",
  "cxx",
  "hpp",
  "hh",
  "cs",
  "php",
  "sql",
  "yaml",
  "yml",
  "toml",
  "ini",
  "cfg",
  "conf",
  "properties",
  "env",
  "sh",
  "bash",
  "zsh",
  "fish",
  "ps1",
  "bat",
  "cmd",
  "dockerignore",
  "gitignore",
  "editorconfig",
  "gradle",
  "plist",
]);

const TEXT_CODE_FILENAMES = new Set([
  "dockerfile",
  "makefile",
  "rakefile",
  "gemfile",
  "podfile",
  "vagrantfile",
]);

/** 확장자 기준: 문서/설정형 텍스트는 텍스트 아이콘, 그 외 코드류는 코드 아이콘 */
const TEXT_LIKE_EXT = new Set([
  "txt",
  "md",
  "markdown",
  "log",
  "csv",
  "tsv",
  "json",
  "jsonl",
  "xml",
  "yaml",
  "yml",
  "toml",
  "ini",
  "cfg",
  "conf",
  "properties",
  "env",
  "html",
  "htm",
  "xhtml",
  "dockerignore",
  "gitignore",
  "editorconfig",
  "plist",
]);

function getExt(filename) {
  const i = filename.lastIndexOf(".");
  return i >= 0 ? filename.slice(i + 1).toLowerCase() : "";
}

function getPreviewKind(filename) {
  const base = filename.replace(/^.*[/\\]/, "");
  const lower = base.toLowerCase();

  if (TEXT_CODE_FILENAMES.has(lower)) {
    return "text";
  }

  const ext = getExt(base);
  if (IMAGE_EXT.has(ext)) return "image";
  if (VIDEO_EXT.has(ext)) return "video";
  if (ext === "pdf") return "pdf";
  if (TEXT_CODE_EXT.has(ext)) return "text";

  if (!ext && lower.startsWith("readme")) return "text";

  return null;
}

function getEntryIconKind(entry) {
  if (entry.is_dir) {
    return "folder";
  }
  const base = entry.name.replace(/^.*[/\\]/, "");
  const lower = base.toLowerCase();

  if (TEXT_CODE_FILENAMES.has(lower)) {
    return "code";
  }

  const ext = getExt(base);
  if (!ext && lower.startsWith("readme")) {
    return "text";
  }

  if (IMAGE_EXT.has(ext)) {
    return "image";
  }
  if (VIDEO_EXT.has(ext)) {
    return "video";
  }
  if (ext === "pdf") {
    return "pdf";
  }
  if (TEXT_CODE_EXT.has(ext)) {
    return TEXT_LIKE_EXT.has(ext) ? "text" : "code";
  }

  return "file";
}

function EntryIcon({ kind }) {
  const common = {
    xmlns: "http://www.w3.org/2000/svg",
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  switch (kind) {
    case "folder":
      return (
        <svg {...common}>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "image":
      return (
        <svg {...common}>
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      );
    case "video":
      return (
        <svg {...common}>
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect width="15" height="14" x="1" y="5" rx="2" ry="2" />
        </svg>
      );
    case "pdf":
      return (
        <svg {...common}>
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M10 12h4M10 16h4" strokeWidth="2" />
        </svg>
      );
    case "text":
      return (
        <svg {...common}>
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M8 13h8M8 17h6M8 9h2" strokeWidth="2" />
        </svg>
      );
    case "code":
      return (
        <svg {...common}>
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
  }
}

function buildDownloadUrl(path, { inline = false } = {}) {
  const params = new URLSearchParams();
  params.set("path", path);
  if (inline) {
    params.set("inline", "true");
  }
  return `${API_BASE_URL}/api/download?${params.toString()}`;
}

function buildPublicApiUrl(apiPath) {
  const normalized = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
  if (API_BASE_URL) {
    return `${API_BASE_URL}${normalized}`;
  }
  return `${window.location.origin}${normalized}`;
}

function formatShareExpiry(expiresAt) {
  return new Date(expiresAt * 1000).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBytes(bytes) {
  if (!bytes) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(value < 10 && idx > 0 ? 1 : 0)} ${units[idx]}`;
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.click();
  URL.revokeObjectURL(url);
}

function parseCharset(contentType = "") {
  const match = contentType.match(/charset=([^;]+)/i);
  return match?.[1]?.trim().toLowerCase() || "";
}

function decodeWithFallback(buffer, preferredCharset) {
  const candidates = [preferredCharset, "utf-8", "euc-kr"].filter(Boolean);
  const unique = [...new Set(candidates)];
  const scored = [];

  for (const charset of unique) {
    try {
      const decoded = new TextDecoder(charset).decode(buffer);
      const replacementCount = (decoded.match(/\uFFFD/g) || []).length;
      scored.push({ decoded, replacementCount });
    } catch {
      // Ignore unsupported charset and try the next candidate.
    }
  }

  if (scored.length === 0) {
    return new TextDecoder("utf-8").decode(buffer);
  }

  scored.sort((a, b) => a.replacementCount - b.replacementCount);
  return scored[0].decoded;
}

function PathBreadcrumb({ currentPath, disabled, onNavigate }) {
  if (!currentPath) {
    return null;
  }

  const parts = currentPath.split(/[/\\]/).filter(Boolean);

  return (
    <nav className="path-breadcrumb" aria-label="폴더 경로">
      <button type="button" className="breadcrumb-jump" disabled={disabled} onClick={() => onNavigate("")}>
        루트
      </button>
      {parts.map((part, index) => {
        const prefix = parts.slice(0, index + 1).join("/");
        return (
          <span key={prefix} className="breadcrumb-bit">
            <span className="breadcrumb-sep">/</span>
            <button type="button" className="breadcrumb-jump" disabled={disabled} onClick={() => onNavigate(prefix)}>
              {part}
            </button>
          </span>
        );
      })}
    </nav>
  );
}

export default function App() {
  const [currentPath, setCurrentPath] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [downloadingPath, setDownloadingPath] = useState(null);
  const [sharingPath, setSharingPath] = useState(null);
  const [shareDialog, setShareDialog] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [deletingPath, setDeletingPath] = useState(null);
  const [deleteConfirmEntry, setDeleteConfirmEntry] = useState(null);
  const [error, setError] = useState("");

  const [preview, setPreview] = useState(null);
  const [previewText, setPreviewText] = useState("");
  const [previewTextLoading, setPreviewTextLoading] = useState(false);
  const [previewTextError, setPreviewTextError] = useState("");

  const [apiConnection, setApiConnection] = useState("checking");

  const queryPath = useMemo(() => encodeURIComponent(currentPath), [currentPath]);

  useEffect(() => {
    let cancelled = false;
    const intervalMs = 15000;

    async function pingApi() {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(`${API_BASE_URL}/health`, {
          signal: controller.signal,
        });
        if (cancelled) return;
        const data = await response.json().catch(() => ({}));
        const ok = response.ok && (data.status === "ok" || data.status === undefined);
        setApiConnection(ok ? "online" : "offline");
      } catch {
        if (!cancelled) {
          setApiConnection("offline");
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    pingApi();
    const id = window.setInterval(pingApi, intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  async function loadDirectory(signal) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/list?path=${queryPath}`, { signal });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "디렉토리를 불러오지 못했습니다.");
      }
      const data = await response.json();
      setCurrentPath(data.current_path || "");
      setEntries(data.entries || []);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    loadDirectory(controller.signal);
    return () => controller.abort();
  }, [queryPath]);

  useEffect(() => {
    if (!preview || preview.kind !== "text") {
      return;
    }

    if (preview.entry.size > MAX_PREVIEW_TEXT_BYTES) {
      setPreviewText("");
      setPreviewTextError(
        `파일이 너무 큽니다 (${formatBytes(preview.entry.size)}). 미리보기는 최대 ${formatBytes(MAX_PREVIEW_TEXT_BYTES)}까지입니다.`
      );
      setPreviewTextLoading(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    async function loadText() {
      setPreviewTextLoading(true);
      setPreviewTextError("");
      setPreviewText("");
      try {
        const response = await fetch(buildDownloadUrl(preview.entry.path, { inline: true }), {
          signal: controller.signal,
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.detail || "파일을 불러오지 못했습니다.");
        }
        const buffer = await response.arrayBuffer();
        const charset = parseCharset(response.headers.get("content-type") || "");
        const text = decodeWithFallback(buffer, charset);
        if (!cancelled) {
          setPreviewText(text);
        }
      } catch (err) {
        if (err.name !== "AbortError" && !cancelled) {
          setPreviewTextError(err.message || "텍스트를 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) {
          setPreviewTextLoading(false);
        }
      }
    }

    loadText();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [preview]);

  useEffect(() => {
    if (!preview && !deleteConfirmEntry && !shareDialog) {
      return;
    }

    function onKeyDown(event) {
      if (event.key !== "Escape") {
        return;
      }
      if (shareDialog) {
        closeShareDialog();
        return;
      }
      if (deleteConfirmEntry) {
        setDeleteConfirmEntry(null);
        return;
      }
      if (preview) {
        closePreview();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [preview, deleteConfirmEntry, shareDialog]);

  async function onUploadChange(event) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(null);
    setError("");
    try {
      const failures = [];
      const total = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`${i + 1}/${total}`);

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${API_BASE_URL}/api/upload?path=${queryPath}`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          failures.push(`${file.name}: ${data.detail || "실패"}`);
        }
      }

      await loadDirectory();
      event.target.value = "";

      if (failures.length > 0) {
        const shown = failures.slice(0, 5).join(" · ");
        const suffix =
          failures.length > 5 ? ` · 외 ${failures.length - 5}건` : "";
        setError(`일부 업로드 실패 (${failures.length}/${total}) — ${shown}${suffix}`);
      }
    } catch (err) {
      setError(err.message || "업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  async function downloadFile(entry) {
    setDownloadingPath(entry.path);
    setError("");
    try {
      const response = await fetch(buildDownloadUrl(entry.path));
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "다운로드에 실패했습니다.");
      }
      const blob = await response.blob();
      triggerBlobDownload(blob, entry.name);
    } catch (err) {
      setError(err.message || "다운로드 중 오류가 발생했습니다.");
    } finally {
      setDownloadingPath(null);
    }
  }

  async function createShareLink(entry) {
    setSharingPath(entry.path);
    setError("");
    try {
      const params = new URLSearchParams({ path: entry.path });
      const response = await fetch(`${API_BASE_URL}/api/share?${params.toString()}`, {
        method: "POST",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "공유 링크를 만들지 못했습니다.");
      }
      const data = await response.json();
      setShareCopied(false);
      setShareDialog({
        entry,
        url: buildPublicApiUrl(data.download_path),
        expiresAt: data.expires_at,
        expiresIn: data.expires_in,
      });
    } catch (err) {
      setError(err.message || "공유 링크 생성 중 오류가 발생했습니다.");
    } finally {
      setSharingPath(null);
    }
  }

  function closeShareDialog() {
    setShareDialog(null);
    setShareCopied(false);
  }

  async function copyShareLink() {
    if (!shareDialog?.url) {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareDialog.url);
      setShareCopied(true);
    } catch {
      setError("링크를 클립보드에 복사하지 못했습니다.");
    }
  }

  function openPreview(entry) {
    const kind = getPreviewKind(entry.name);
    if (!kind) return;
    setPreview({ entry, kind });
    setPreviewText("");
    setPreviewTextError("");
    setPreviewTextLoading(kind === "text");
  }

  function handleEntryActivate(entry) {
    if (entry.is_dir) {
      setCurrentPath(entry.path);
      return;
    }
    openPreview(entry);
  }

  function closePreview() {
    setPreview(null);
    setPreviewText("");
    setPreviewTextError("");
    setPreviewTextLoading(false);
  }

  function openDeleteConfirm(entry) {
    setDeleteConfirmEntry(entry);
  }

  async function executeDelete() {
    const entry = deleteConfirmEntry;
    if (!entry) {
      return;
    }

    setDeleteConfirmEntry(null);
    setDeletingPath(entry.path);
    setError("");
    try {
      const params = new URLSearchParams({ path: entry.path });
      const response = await fetch(`${API_BASE_URL}/api/delete?${params.toString()}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "삭제에 실패했습니다.");
      }

      if (preview?.entry.path === entry.path) {
        closePreview();
      }

      await loadDirectory();
    } catch (err) {
      setError(err.message || "삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingPath(null);
    }
  }

  const previewSrc = preview ? buildDownloadUrl(preview.entry.path, { inline: true }) : "";

  return (
    <main className="container">
      <header className="header">
        <div className="header-row">
          <h1>Tomato File Explorer</h1>
          <div
            className={`api-status api-status--${apiConnection}`}
            title={API_BASE_URL}
          >
            <span className="api-status-dot" aria-hidden />
            <span className="api-status-text">
              {apiConnection === "checking" && "API 확인 중"}
              {apiConnection === "online" && "API 연결됨"}
              {apiConnection === "offline" && "API 연결 안 됨"}
            </span>
          </div>
        </div>
      </header>

      <section className="path-bar">
        <PathBreadcrumb currentPath={currentPath} disabled={loading || uploading} onNavigate={setCurrentPath} />
        <div className="actions">
          <label className="upload-btn">
            {uploading ? `업로드 중${uploadProgress ? ` (${uploadProgress})` : ""}…` : "파일 업로드"}
            <input type="file" multiple onChange={onUploadChange} disabled={uploading || loading} />
          </label>
        </div>
      </section>

      {error && <div className="error">{error}</div>}

      <section className="list">
        {loading ? (
          <p>불러오는 중...</p>
        ) : entries.length === 0 ? (
          <p>항목이 없습니다.</p>
        ) : (
          entries.map((entry) => {
            const previewKind = entry.is_dir ? null : getPreviewKind(entry.name);
            const iconKind = getEntryIconKind(entry);
            const isActivatable = entry.is_dir || Boolean(previewKind);
            return (
              <div
                key={entry.path}
                className={`row ${entry.is_dir ? "dir" : "file"}${isActivatable ? " activatable" : ""}`}
                role={isActivatable ? "button" : undefined}
                tabIndex={isActivatable ? 0 : undefined}
                onClick={isActivatable ? () => handleEntryActivate(entry) : undefined}
                onKeyDown={
                  isActivatable
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleEntryActivate(entry);
                        }
                      }
                    : undefined
                }
              >
                <div className="row-name-wrap">
                  <span className={`entry-icon entry-icon--${iconKind}`}>
                    <EntryIcon kind={iconKind} />
                  </span>
                  <span className="name">{entry.name}</span>
                </div>
                <div className="meta-actions" onClick={(event) => event.stopPropagation()}>
                  <span className="meta">{entry.is_dir ? "폴더" : formatBytes(entry.size)}</span>
                  {entry.is_dir ? (
                    <button
                      type="button"
                      className="btn-delete"
                      disabled={deletingPath === entry.path || loading || uploading}
                      onClick={() => openDeleteConfirm(entry)}
                    >
                      {deletingPath === entry.path ? "삭제 중..." : "삭제"}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="download-link"
                        disabled={sharingPath === entry.path}
                        onClick={() => void createShareLink(entry)}
                      >
                        {sharingPath === entry.path ? "만드는 중..." : "공유하기"}
                      </button>
                      <button
                        type="button"
                        className="download-link"
                        disabled={downloadingPath === entry.path}
                        onClick={() => downloadFile(entry)}
                      >
                        {downloadingPath === entry.path ? "받는 중..." : "다운로드"}
                      </button>
                      <button
                        type="button"
                        className="btn-delete"
                        disabled={deletingPath === entry.path || loading || uploading}
                        onClick={() => openDeleteConfirm(entry)}
                      >
                        {deletingPath === entry.path ? "삭제 중..." : "삭제"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>

      {preview && (
        <div className="preview-backdrop" role="presentation" onClick={closePreview}>
          <div className="preview-panel" role="dialog" aria-modal="true" aria-label="파일 미리보기" onClick={(e) => e.stopPropagation()}>
            <div className="preview-toolbar">
              <div className="preview-title">
                <strong>{preview.entry.name}</strong>
                <span className="preview-meta">{formatBytes(preview.entry.size)}</span>
              </div>
              <button type="button" className="preview-close" onClick={closePreview}>
                닫기
              </button>
            </div>

            <div className="preview-body">
              {preview.kind === "image" && (
                <div className="preview-image-wrap">
                  <img src={previewSrc} alt={preview.entry.name} />
                </div>
              )}

              {preview.kind === "video" && (
                <video className="preview-video" src={previewSrc} controls playsInline>
                  이 브라우저는 비디오 태그를 지원하지 않습니다.
                </video>
              )}

              {preview.kind === "pdf" && (
                <iframe className="preview-pdf" src={previewSrc} title={preview.entry.name} />
              )}

              {preview.kind === "text" && (
                <div className="preview-text-wrap">
                  {previewTextLoading && <p className="preview-hint">불러오는 중...</p>}
                  {previewTextError && <div className="preview-text-error">{previewTextError}</div>}
                  {!previewTextLoading && !previewTextError && (
                    <pre className="preview-code">
                      <code>{previewText}</code>
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {shareDialog && (
        <div className="share-dialog-backdrop" role="presentation" onClick={closeShareDialog}>
          <div
            className="share-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="share-dialog-title" className="share-dialog-title">
              공유 링크
            </h2>
            <p className="share-dialog-body">
              <strong className="share-dialog-name">{shareDialog.entry.name}</strong> 파일의 임시 다운로드 링크입니다.
            </p>
            <p className="share-dialog-expiry">
              {Math.round(shareDialog.expiresIn / 60)}분 후 만료 ({formatShareExpiry(shareDialog.expiresAt)}까지)
            </p>
            <div className="share-dialog-link-row">
              <input className="share-dialog-input" type="text" readOnly value={shareDialog.url} />
              <button type="button" className="share-dialog-copy" onClick={() => void copyShareLink()}>
                {shareCopied ? "복사됨" : "복사"}
              </button>
            </div>
            <div className="share-dialog-actions">
              <button type="button" className="share-dialog-close" onClick={closeShareDialog}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmEntry && (
        <div
          className="delete-dialog-backdrop"
          role="presentation"
          onClick={() => setDeleteConfirmEntry(null)}
        >
          <div
            className="delete-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-dialog-title" className="delete-dialog-title">
              삭제 확인
            </h2>
            <p id="delete-dialog-desc" className="delete-dialog-body">
              <strong className="delete-dialog-name">{deleteConfirmEntry.name}</strong>
              {deleteConfirmEntry.is_dir ? " 폴더" : " 파일"}을(를) 정말 삭제할까요?
              {deleteConfirmEntry.is_dir && (
                <span className="delete-dialog-warn"> 폴더 안의 모든 항목이 함께 삭제됩니다.</span>
              )}
            </p>
            <div className="delete-dialog-actions">
              <button type="button" className="delete-dialog-cancel" onClick={() => setDeleteConfirmEntry(null)}>
                취소
              </button>
              <button type="button" className="delete-dialog-confirm" onClick={() => void executeDelete()}>
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
