(function (global) {
  const BASE = "https://gutendex.com/books/";

  const listUrl = (page = 1, q = "") =>
    `${BASE}?languages=en&mime_type=application%2Fepub%2Bzip&page=${page}` +
    (q ? `&search=${encodeURIComponent(q)}` : "");

  async function getJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.json();
  }

  // Popular / Latest
  async function getPopular(page = 1) {
    const data = await getJSON(listUrl(page));
    return {
      items: data.results.map((b) => ({
        id: String(b.id),
        title: b.title,
        cover: b.formats?.["image/jpeg"] || null,
        authors: (b.authors || []).map((a) => a.name),
        tags: [...(b.bookshelves || []), ...(b.subjects || [])],
        lang: (b.languages && b.languages[0]) || "en",
        url: `${BASE}${b.id}`
      })),
      hasNextPage: !!data.next
    };
  }

  // Search
  async function search(query, page = 1) {
    const data = await getJSON(listUrl(page, query));
    return {
      items: data.results.map((b) => ({
        id: String(b.id),
        title: b.title,
        cover: b.formats?.["image/jpeg"] || null,
        authors: (b.authors || []).map((a) => a.name),
        url: `${BASE}${b.id}`
      })),
      hasNextPage: !!data.next
    };
  }

  // Details
  async function getDetails(idOrUrl) {
    const id = Number(String(idOrUrl).trim().split("/").filter(Boolean).pop());
    if (!Number.isFinite(id)) throw new Error(`Invalid Gutendex id: ${idOrUrl}`);
    const b = await getJSON(`${BASE}${id}`);
    const epub = b.formats?.["application/epub+zip"] || null;

    return {
      id: String(b.id),
      title: b.title,
      cover: b.formats?.["image/jpeg"] || null,
      authors: (b.authors || []).map((a) => a.name),
      description: (b.summaries && b.summaries[0]) || (b.bookshelves || []).join(", "),
      tags: b.subjects || [],
      language: (b.languages && b.languages[0]) || "en",
      chapters: epub ? [{ name: "Download EPUB", url: epub, index: 1 }] : [],
      epubUrl: epub
    };
  }

  function metadata() {
    return {
      id: "gutendex",
      name: "Gutendex",
      version: "1.0.0",
      website: "https://gutendex.com",
      languages: ["en"],
      type: "novel",
      icon: "plugins/gutendex/icon.png"
    };
  }

  // Expose for LNReader external loader
  const plugin = { getPopular, search, getDetails, metadata };
  global.Gutendex = plugin;
})(globalThis);
