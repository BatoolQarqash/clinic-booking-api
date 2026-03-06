// frontend/js/api.js

async function apiFetch(path, { method = "GET", body = null, auth = false } = {}) {
  const url = `${API_BASE}${path}`;

  const headers = {
    Accept: "application/json"
  };

  const isFormData = body instanceof FormData;

  // Only set JSON content-type when body is plain JSON
  if (body !== null && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  // Attach JWT token when auth is required
  if (auth) {
    const token = (typeof getToken === "function")
      ? getToken()
      : localStorage.getItem(TOKEN_KEY);

    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === null
        ? null
        : isFormData
          ? body
          : JSON.stringify(body)
    });
  } catch {
    throw new Error("Network error: backend is not reachable.");
  }

  let data = null;
  if (res.status !== 204) {
    try { data = await res.json(); } catch {}
  }

  if (!res.ok) {
    const validationErrors = data?.errors
      ? Object.values(data.errors).flat().join(" | ")
      : null;

    const msg =
      data?.message ||
      data?.detail ||
      validationErrors ||
      data?.title ||
      `Request failed (${res.status})`;

    throw new Error(msg);
  }

  return data;
}