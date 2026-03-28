let allData = [];
let favorites = new Set();

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ14cW0LzMG6hPjkdWry9d_X8P_Uag-M84cN00o317GK9CCJVuknQkgbTE-O60P54wU7Wd_Uxkuna2h/pub?gid=1251597746&single=true&output=csv";

// DOM
const searchInput = document.getElementById("search");
const searchMode = document.getElementById("searchMode");
const favoritesOnly = document.getElementById("favoritesOnly");
const list = document.getElementById("list");

// LOAD CSV
fetch(SHEET_URL)
  .then((res) => {
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    return res.text();
  })
  .then((csv) => {
    const parsed = Papa.parse(csv, {
      header: true,
      skipEmptyLines: true
    });

    allData = parsed.data;
    renderList(allData);
  })
  .catch((err) => {
    console.error("Failed to load CSV:", err);
    list.innerHTML = `<div style="padding:16px;">Could not load data.</div>`;
  });

// EVENTS
searchInput.addEventListener("input", filterAndRender);
searchMode.addEventListener("change", filterAndRender);
favoritesOnly.addEventListener("change", filterAndRender);

function safeValue(value) {
  return (value || "").toString().toLowerCase().trim();
}

// FILTER
function filterAndRender() {
  const query = safeValue(searchInput.value);
  const mode = searchMode.value;
  const favOnly = favoritesOnly.checked;

  const filtered = allData.filter((item) => {
    const itemId = String(item.ID || "");

    if (favOnly && !favorites.has(itemId)) {
      return false;
    }

    if (!query) {
      return true;
    }

    const title = safeValue(item.Title);
    const creator = safeValue(item.Creator);
    const keywords = safeValue(item.Keywords);
    const language = safeValue(item.Language);

    if (mode === "all") {
      return (
        title.includes(query) ||
        creator.includes(query) ||
        keywords.includes(query) ||
        language.includes(query)
      );
    }

    if (mode === "title") return title.includes(query);
    if (mode === "creator") return creator.includes(query);
    if (mode === "keywords") return keywords.includes(query);
    if (mode === "language") return language.includes(query);

    return true;
  });

  renderList(filtered);
}

// RENDER
function renderList(data) {
  list.innerHTML = "";

  data.forEach((item) => {
    const itemId = String(item.ID || "");

    const card = document.createElement("div");
    card.className = "card";

    // LEFT
    const top = document.createElement("div");
    top.className = "top";

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = item.Title || "";

    const meta = document.createElement("div");
    meta.className = "meta";

    const creator = document.createElement("div");
    creator.className = "creator";
    creator.textContent = item.Creator || "";

    const language = document.createElement("div");
    language.className = "language";
    language.textContent = item.Language || "";

    if (item.Creator) {
      meta.appendChild(creator);
    }

    if (item.Creator && item.Language) {
      const separator = document.createElement("span");
      separator.className = "meta-separator";
      separator.textContent = "•";
      meta.appendChild(separator);
    }

    if (item.Language) {
      meta.appendChild(language);
    }

    top.appendChild(title);
    top.appendChild(meta);

    // MIDDLE
    const keywords = document.createElement("div");
    keywords.className = "keywords";

    (item.Keywords || "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)
      .forEach((k) => {
        const pill = document.createElement("span");
        pill.className = "pill";
        pill.textContent = k;
        keywords.appendChild(pill);
      });

    // RIGHT
    const links = document.createElement("div");
    links.className = "links";

    const star = document.createElement("button");
    star.className = "star";
    star.type = "button";
    star.textContent = "★";
    star.setAttribute("aria-label", "Toggle favorite");

    if (favorites.has(itemId)) {
      star.classList.add("fav");
    }

    star.addEventListener("click", () => {
      if (favorites.has(itemId)) {
        favorites.delete(itemId);
      } else {
        favorites.add(itemId);
      }

      filterAndRender();
    });

    links.appendChild(star);

    if (item.Video) {
      const videoLink = document.createElement("a");
      videoLink.className = "icon-link";
      videoLink.href = item.Video;
      videoLink.target = "_blank";
      videoLink.rel = "noopener noreferrer";
      videoLink.textContent = "Video";
      links.appendChild(videoLink);
    }

    if (item.Supplemental) {
      const supplementalLink = document.createElement("a");
      supplementalLink.className = "icon-link";
      supplementalLink.href = item.Supplemental;
      supplementalLink.target = "_blank";
      supplementalLink.rel = "noopener noreferrer";
      supplementalLink.textContent = "Extra";
      links.appendChild(supplementalLink);
    }

    card.appendChild(top);
    card.appendChild(keywords);
    card.appendChild(links);

    list.appendChild(card);
  });
}
