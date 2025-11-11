export function isWikipediaUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname.endsWith("wikipedia.org") && u.pathname.includes("/wiki/");
  } catch {
    return false;
  }
}

export function parseOrigins(str) {
  if (!str) return ["*"];
  return str.split(",").map((s) => s.trim()).filter(Boolean);
}
