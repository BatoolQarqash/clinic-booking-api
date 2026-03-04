async function apiFetch(path, { method = "GET", body = null, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  let data = null;
  try { data = await res.json(); } catch {}

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.detail ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}