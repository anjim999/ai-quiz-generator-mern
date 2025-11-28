// frontend/src/services/api.js
const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getToken() {
  try {
    const raw = localStorage.getItem("auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
}

function authHeaders(extra = {}) {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}`, ...extra }
    : { ...extra };
}

export { authHeaders };

export async function generateQuiz(url, forceRefresh = false, count = 10) {
  const res = await fetch(`${BASE}/api/quiz/generate_quiz?count=${count}`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ url, force_refresh: forceRefresh }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    const status = res.status;
    if (status === 401) {
      throw new Error("Unauthorized: Your session may have expired. Please log in again.");
    }
    throw new Error(`Quiz generation failed (${status}): ${text}`);
  }
  return res.json();
}

export async function fetchHistory() {
  const res = await fetch(`${BASE}/api/quiz/history`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const status = res.status;
    if (status === 401) {
      throw new Error("Your session expired. Please log in again.");
    }
    throw new Error(`Failed to load history (${status})`);
  }
  return res.json();
}

export async function fetchQuizById(id) {
  const res = await fetch(`${BASE}/api/quiz/quiz/${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const status = res.status;
    if (status === 401) {
      throw new Error("Your session expired. Please log in again.");
    }
    throw new Error(`Quiz not found (${status})`);
  }
  return res.json();
}

export async function submitAttempt(quizId, payload = {}) {
  const res = await fetch(`${BASE}/api/quiz/submit_attempt/${quizId}`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });

  // Backend returns { saved: true, attempt_id }
  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || "Failed to submit attempt");
  }

  return res.json();
}
