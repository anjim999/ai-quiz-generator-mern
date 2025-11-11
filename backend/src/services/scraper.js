import axios from "axios";
import * as cheerio from "cheerio";

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const MAIN_SELECTOR = "#mw-content-text .mw-parser-output";

/**
 * TC: O(N) DOM traversal; SC: O(N) string building
 */
export function cleanWikipediaHtml(html) {
  const $ = cheerio.load(html);
  const title = $("#firstHeading").text().trim() || "Untitled";
  const main = $(MAIN_SELECTOR).first();
  if (!main.length) return { title, cleanedHtml: html, cleanedText: "" };

  const remove = [
    "table",
    "style",
    "script",
    "noscript",
    "figure",
    "span.mw-editsection",
    "div.navbox",
    "div.reflist",
    "ol.references",
    "sup.reference"
  ];
  for (const sel of remove) main.find(sel).remove();

  const parts = [];
  main.find("p, li").each((_, el) => {
    const t = $(el).text().replace(/\s+/g, " ").trim();
    if (t) parts.push(t);
  });

  return { title, cleanedHtml: main.html() || "", cleanedText: parts.join("\n") };
}

/**
 * TC: O(N), SC: O(N)
 */
export async function scrapeWikipedia(url) {
  const resp = await axios.get(url, { headers: { "User-Agent": UA }, timeout: 20000 });
  const raw = resp.data;
  const { title, cleanedHtml, cleanedText } = cleanWikipediaHtml(raw);

  const $ = cheerio.load(cleanedHtml);
  const sections = [];
  $("h2, h3").each((_, h) => {
    const t = $(h).text().replace("[edit]", "").trim();
    if (t) sections.push(t);
  });

  return [title, cleanedText, sections, raw];
}
