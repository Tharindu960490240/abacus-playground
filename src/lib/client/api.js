// Small fetch wrapper: same-origin, sends the session cookie, throws readable errors.
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(method, url, body, { raw = false } = {}) {
  const init = { method, credentials: "same-origin", headers: {} };
  if (body instanceof FormData) init.body = body;
  else if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError(0, "Could not reach the server. Check your connection and try again.");
  }
  if (raw && res.ok) return res;
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* not JSON */
  }
  if (!res.ok || data?.success === false) {
    throw new ApiError(res.status, data?.error || `Request failed (${res.status})`);
  }
  return data?.data;
}

export const api = {
  get: (url) => request("GET", url),
  post: (url, body) => request("POST", url, body ?? {}),
  put: (url, body) => request("PUT", url, body),
  patch: (url, body) => request("PATCH", url, body),
  del: (url) => request("DELETE", url),
  upload: (url, file, field = "file") => {
    const fd = new FormData();
    fd.append(field, file);
    return request("POST", url, fd);
  },
};

/** Downloads a file from a GET or POST endpoint and saves it. */
export async function downloadFile(url, filename, body) {
  const res = await request(body ? "POST" : "GET", url, body, { raw: true });
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 10000);
}
