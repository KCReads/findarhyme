let allData = [];
let favorites = new Set();

// =========================
// LOAD CSV (PapaParse)
// =========================
fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vRpcuB3lP6poEiXufRP7C_pdB3ZHz4WB82Zg5JmLSUg_BvjoC7xM5BDqG5PhdZOFg/pub?gid=1251597746&single=true&output=csv")
  .then(res => res.text())
  .then(csv => {
    const parsed = Papa.parse(csv, {
      header: true,
      skipEmptyLines: true
    });

    allData = parsed.data;

    renderList(allData);
  });

// =========================
// DOM ELEMENTS
// =========================
const searchInput = document.getElementById("search");
const searchMode = document.getElementById("searchMode");
const favoritesOnly = document.getElementById("favoritesOnly");
const list = document.getElementById("list");

// =========================
// EVENTS (LIVE FILTERING)
// =========================
searchInput.addEventListener("input", filterAndRender);
searchMode.addEventListener("change", filterAndRender);
favoritesOnly.addEventListener("change", filterAndRender);

// =========================
// FILTER LOGIC
// =========================
function filterAndRender() {
  const query = searchInput.value.toLowerCase().trim();
  const mode = searchMode.value;
  const favOnly = favoritesOnly.checked;

  let filtered = allData.filter(item => {

    // FAVORITES FILTER
    if (favOnly && !favorites.has(item.title)) {
      return false;
    }

    if (!query) return true;

    const title = (item.title || "").toLowerCase();
    const creator = (item.creator || "").toLowerCase();
    const keywords = (item.keywords || "").toLowerCase();

    if (mode === "all") {
      return (
        title.includes(query) ||
        creator.includes(query) ||
        keywords.includes(query)
      );
    }

    if (mode === "title") return title.includes(query);
    if (mode === "creator") return creator.includes(query);
    if (mode === "keywords") return keywords.includes(query);

    return true;
  });

  renderList(filtered);
}

// =========================
// RENDER LIST
// =========================
function renderList(data) {
  list.innerHTML = "";

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    // LEFT
    const top = document.createElement("div");
    top.className = "top";

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = item.title || "";

    const creator = document.createElement("div");
    creator.className = "creator";
    creator.textContent = item.creator || "";

    top.appendChild(title);
    top.appendChild(creator);

    // MIDDLE (KEYWORDS)
    const keywords = document.createElement("div");
    keywords.className = "keywords";

    (item.keywords || "")
      .split(",")
      .map(k => k.trim())
      .filter(Boolean)
      .forEach(k => {
        const pill = document.createElement("span");
        pill.className = "pill";
        pill.textContent = k;
        keywords.appendChild(pill);
      });

    // RIGHT (LINKS + FAVORITE)
    const links = document.createElement("div");
    links.className = "links";

    // FAVORITE BUTTON
    const star = document.createElement("button");
    star.className = "icon-link";
    star.textContent = favorites.has(item.title) ? "★" : "☆";

    star.addEventListener("click", () => {
      if (favorites.has(item.title)) {
        favorites.delete(item.title);
      } else {
        favorites.add(item.title);
      }

      filterAndRender();
    });

    links.appendChild(star);

    // OPTIONAL LINK (if you have one in CSV)
    if (item.link) {
      const link = document.createElement("a");
      link.className = "icon-link";
      link.href = item.link;
      link.target = "_blank";
      link.textContent = "Open";

      links.appendChild(link);
    }

    // BUILD CARD
    card.appendChild(top);
    card.appendChild(keywords);
    card.appendChild(links);

    list.appendChild(card);
  });
}
