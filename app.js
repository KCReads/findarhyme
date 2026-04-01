const CSV_PATH = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ14cW0LzMG6hPjkdWry9d_X8P_Uag-M84cN00o317GK9CCJVuknQkgbTE-O60P54wU7Wd_Uxkuna2h/pub?gid=1251597746&single=true&output=csv";

/* =========================
   CATEGORY CONFIG (FINAL)
========================= */
const CATEGORY_CONFIG = [
  { key: "Early_Literacy_Skill", className: "early-literacy-pill", type: "keyword" },
  { key: "Physical_Skill", className: "developmental-pill", type: "keyword" },
  { key: "Cognitive_Skill", className: "developmental-pill", type: "keyword" },
  { key: "Social_Emotional_Skill", className: "social-skill-pill", type: "keyword" },
  { key: "Concept", className: "theme-pill", type: "keyword" },
  { key: "Theme", className: "theme-pill", type: "keyword" },
  { key: "Tune", className: "tune-pill", type: "keyword" },
  { key: "Language", className: "language-pill", type: "language" },
  { key: "Prop", className: "prop-pill", type: "keyword" },

  /* swapped */
  { key: "Music_Genre", className: "song-type-pill", type: "keyword" },
  { key: "Format", className: "music-genre-pill", type: "keyword" },

  { key: "Music_Source", className: "recorded-music-pill", type: "keyword" }
];

/* =========================
   STATE
========================= */
let allRows = [];
let activeKeyword = "";
let activeLanguage = "";

const favorites = new Set(JSON.parse(localStorage.getItem("favorites") || "[]"));

function saveFavorites() {
  localStorage.setItem("favorites", JSON.stringify([...favorites]));
}

/* =========================
   HELPERS
========================= */
function normalize(value) {
  return String(value ?? "").trim();
}

function lower(value) {
  return normalize(value).toLowerCase();
}

function splitValues(value) {
  return String(value ?? "")
    .split(/[|,;]+/)
    .map(v => v.trim())
    .filter(Boolean);
}

function getField(row, names) {
  for (const name of names) {
    if (row[name]) return row[name];

    // underscore fallback
    const alt = name.replace(/ /g, "_");
    if (row[alt]) return row[alt];
  }
  return "";
}

function getRowId(row, index) {
  return (
    getField(row, ["Id", "ID", "id"]) ||
    `${getField(row, ["Title"])}_${index}`
  );
}

function getTitle(row) {
  return getField(row, ["Title"]);
}

function getCreator(row) {
  return getField(row, ["Creator"]);
}

function getLink(row) {
  return getField(row, ["Video_Link", "Video Link", "Link"]);
}

/* =========================
   FLAGS
========================= */
function isAISupported(row) {
  return lower(getField(row, ["AI_Supported"])).includes("yes");
}

function hasProblematic(row) {
  return lower(getField(row, ["Problematic_History"])).includes("yes");
}

/* =========================
   TOGGLE LOGIC
========================= */
function toggleKeyword(val) {
  activeKeyword = activeKeyword === val ? "" : val;
  activeLanguage = "";
  renderList();
}

function toggleLanguage(val) {
  activeLanguage = activeLanguage === val ? "" : val;
  activeKeyword = "";
  renderList();
}

/* =========================
   FILTER
========================= */
function getFilteredRows() {
  const search = lower(document.getElementById("search").value);
  const mode = document.getElementById("searchMode").value;

  return allRows.filter((row, i) => {
    const title = lower(getTitle(row));
    const creator = lower(getCreator(row));

    const keywords = CATEGORY_CONFIG
      .flatMap(c => splitValues(getField(row, [c.key])))
      .join(" ")
      .toLowerCase();

    const language = lower(getField(row, ["Language"]));

    let matchesSearch = true;

    if (search) {
      if (mode === "title") matchesSearch = title.includes(search);
      else if (mode === "creator") matchesSearch = creator.includes(search);
      else if (mode === "keywords") matchesSearch = keywords.includes(search);
      else if (mode === "language") matchesSearch = language.includes(search);
      else {
        matchesSearch =
          title.includes(search) ||
          creator.includes(search) ||
          keywords.includes(search) ||
          language.includes(search);
      }
    }

    const rowKeywords = keywords.split(" ");

    const matchKeyword =
      !activeKeyword || rowKeywords.includes(activeKeyword.toLowerCase());

    const matchLanguage =
      !activeLanguage || language.includes(activeLanguage.toLowerCase());

    return matchesSearch && matchKeyword && matchLanguage;
  });
}

/* =========================
   RENDER
========================= */
function renderList() {
  const list = document.getElementById("list");
  list.innerHTML = "";

  const rows = getFilteredRows();

  if (!rows.length) {
    list.innerHTML = `<div class="load-error">No results found.</div>`;
    return;
  }

  rows.forEach((row, i) => {
    const id = getRowId(row, i);

    const card = document.createElement("div");
    card.className = "card";

    /* TOP */
    const top = document.createElement("div");
    top.className = "top";

    const star = document.createElement("button");
    star.className = `star ${favorites.has(id) ? "fav" : ""}`;
    star.textContent = "★";
    star.onclick = () => {
      favorites.has(id) ? favorites.delete(id) : favorites.add(id);
      saveFavorites();
      renderList();
    };

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = getTitle(row);

    const creator = document.createElement("div");
    creator.className = "creator";
    creator.textContent = getCreator(row);

    top.append(star, title, creator);

    /* KEYWORDS */
    const kw = document.createElement("div");
    kw.className = "keywords";

    CATEGORY_CONFIG.forEach(cat => {
      const values = splitValues(getField(row, [cat.key]));
      values.forEach(v => {
        const pill = document.createElement("button");
        pill.className = `pill ${cat.className}`;

        if (
          (cat.type === "language" && v === activeLanguage) ||
          (cat.type === "keyword" && v === activeKeyword)
        ) {
          pill.classList.add("active-pill");
        }

        pill.textContent = v;

        pill.onclick = () =>
          cat.type === "language"
            ? toggleLanguage(v)
            : toggleKeyword(v);

        kw.appendChild(pill);
      });
    });

    /* LINKS */
    const links = document.createElement("div");
    links.className = "links";

    const link = getLink(row);
    if (link) {
      const a = document.createElement("a");
      a.href = link;
      a.target = "_blank";
      a.className = "icon-link";
      a.textContent = "Open Link";
      links.appendChild(a);
    }

    /* FLAGS */
    if (isAISupported(row)) {
      const f = document.createElement("div");
      f.className = "status-flag ai-flag";
      f.textContent = "AI-Supported";
      links.appendChild(f);
    }

    if (hasProblematic(row)) {
      const f = document.createElement("div");
      f.className = "status-flag warning-flag";
      f.textContent = "Problematic History";
      links.appendChild(f);
    }

    card.append(top, kw, links);
    list.appendChild(card);
  });
}

/* =========================
   RESET
========================= */
function resetAll() {
  document.getElementById("search").value = "";
  document.getElementById("searchMode").value = "all";

  activeKeyword = "";
  activeLanguage = "";

  renderList();
}

/* =========================
   INIT
========================= */
function setup() {
  document.getElementById("search").oninput = renderList;
  document.getElementById("searchMode").onchange = renderList;
  document.getElementById("resetSearchBtn").onclick = resetAll;

  document.getElementById("menuToggle").onclick = () => {
    document.getElementById("navBar").classList.toggle("open");
  };
}

function loadCSV() {
  Papa.parse(CSV_PATH, {
    download: true,
    header: true,
    complete: (res) => {
      allRows = res.data;
      renderList();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setup();
  loadCSV();
});