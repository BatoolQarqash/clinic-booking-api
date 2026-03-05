// frontend/js/api.js

async function apiFetch(path, { method = "GET", body = null, auth = false } = {}) {
  const url = `${API_BASE}${path}`;

  const headers = { "Accept": "application/json" };
  if (body !== null) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== null ? JSON.stringify(body) : null
    });
  } catch {
    throw new Error("Network error: backend is not reachable.");
  }

  let data = null;
  try { data = await res.json(); } catch {}

  if (!res.ok) {
    // ✅ Support ProblemDetails + ValidationProblemDetails
    const validationErrors = data?.errors
      ? Object.values(data.errors).flat().join(" | ")
      : null;

    const msg =
      data?.message ||
      data?.detail ||
      validationErrors ||
      data?.title ||                 // <- important for ValidationProblemDetails
      `Request failed (${res.status})`;

    throw new Error(msg);
  }

  return data;
}