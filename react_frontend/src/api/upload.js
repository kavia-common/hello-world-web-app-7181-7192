/**
 * Shared upload helper for all PrimeReact DataTables.
 * - Accepts .xlsx/.csv
 * - Sends multipart/form-data (FormData) to a table-specific endpoint
 */

// PUBLIC_INTERFACE
export function getApiBaseUrl() {
  /** Returns the API base URL from env vars with safe fallbacks. */
  // Prefer explicit API base if present; otherwise fall back to backend URL.
  const base =
    (process.env.REACT_APP_API_BASE || "").trim() ||
    (process.env.REACT_APP_BACKEND_URL || "").trim() ||
    "";

  return base.replace(/\/+$/, "");
}

// PUBLIC_INTERFACE
export async function uploadTableFile({ endpointPath, file, signal } = {}) {
  /**
   * Upload a single file to a given endpoint.
   *
   * @param {object} params
   * @param {string} params.endpointPath - Path portion like "/uploads/rmg-tracker" (leading "/" optional).
   * @param {File} params.file - The file selected by the user.
   * @param {AbortSignal=} params.signal - Optional abort signal.
   * @returns {Promise<object>} Resolves to parsed JSON if response is JSON; otherwise returns `{ ok: true }`.
   */
  if (!endpointPath) throw new Error("Missing endpointPath for upload.");
  if (!file) throw new Error("No file selected.");

  const base = getApiBaseUrl();
  if (!base) {
    throw new Error(
      "API base URL is not configured. Please set REACT_APP_API_BASE or REACT_APP_BACKEND_URL."
    );
  }

  const normalizedPath = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
  const url = `${base}${normalizedPath}`;

  const form = new FormData();
  // Backend-friendly common key name
  form.append("file", file, file.name);

  const res = await fetch(url, {
    method: "POST",
    body: form,
    signal,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    let message = `Upload failed (${res.status}).`;
    if (isJson) {
      try {
        const payload = await res.json();
        message =
          payload?.message ||
          payload?.detail ||
          payload?.error ||
          message;
      } catch {
        // ignore
      }
    } else {
      try {
        const text = await res.text();
        if (text) message = text;
      } catch {
        // ignore
      }
    }
    throw new Error(message);
  }

  if (isJson) {
    try {
      return await res.json();
    } catch {
      return { ok: true };
    }
  }

  return { ok: true };
}
