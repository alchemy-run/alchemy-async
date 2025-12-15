import path from "pathe";

// Common MIME types
const mimeTypes: Record<string, string> = {
  ".css": "text/css",
  ".eot": "application/vnd.ms-fontobject",
  ".gif": "image/gif",
  ".htm": "text/html",
  ".html": "text/html",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js.map": "application/source-map",
  ".js": "text/javascript",
  ".json": "application/json",
  ".md": "text/markdown",
  ".mjs": "text/javascript",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".otf": "font/otf",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".txt": "text/plain",
  ".wasm": "application/wasm",
  ".wav": "audio/wav",
  ".webm": "video/webm",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
  ".zip": "application/zip",
};

/**
 * Gets the content type for a file based on its extension
 *
 * @param filePath Path to the file
 * @returns The content type for the file
 */
export function getContentType(filePath: string): string | undefined {
  if (filePath.endsWith(".js.map")) {
    return mimeTypes[".js.map"];
  }
  return mimeTypes[path.extname(filePath).toLowerCase()];
}
