const CSV_PATH = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ14cW0LzMG6hPjkdWry9d_X8P_Uag-M84cN00o317GK9CCJVuknQkgbTE-O60P54wU7Wd_Uxkuna2h/pub?gid=1251597746&single=true&output=csv";

const CATEGORY_CONFIG = [
  { key: "Early_Literacy_Skill", className: "early-literacy-pill", type: "keyword", group: "Skills" },
  { key: "Physical_Skill", className: "physical-pill", type: "keyword", group: "Skills" },
  { key: "Cognitive_Skill", className: "cognitive-pill", type: "keyword", group: "Skills" },
  { key: "Social_Emotional_Skill", className: "social-skill-pill", type: "keyword", group: "Skills" },
  { key: "Concept", className: "concept-pill", type: "keyword", group: "Content" },
  { key: "Theme", className: "theme-pill", type: "keyword", group: "Content" },
  { key: "Tune", className: "tune-pill", type: "keyword", group: "Music" },
  { key: "Language", className: "language-pill", type: "language", group: "Language" },
  { key: "Prop", className: "prop-pill", type: "keyword", group: "Performance" },
  { key: "Music_Genre", className: "music-genre-pill", type: "keyword", group: "Music" },
  { key: "Format", className: "format-pill", type: "keyword", group: "Performance" },
  { key: "Music_Source", className: "music-source-pill", type: "keyword", group: "Music" }
];

const CATEGORY_GROUPS = [
  { label: "Skills", keys: ["Early_Literacy_Skill", "Physical_Skill", "Cognitive_Skill", "Social_Emotional_Skill"] },
  { label: "Content", keys: ["Concept", "Theme"] },
  { label: "Performance", keys: ["Format", "Prop"] },
  { label: "Music", keys: ["Tune", "Music_Genre", "Music_Source"] },
  { label: "Language", keys: ["Language"] }
];

let allRows = [];
let activeKeyword = "";
let activeLanguage = "";

const favorites = new Set(JSON.parse(localStorage.getItem("favorites") || "[]"));

function saveFavorites() {
  localStorage.setItem("favorites", JSON.stringify([...favorites]));
}

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
    if (row[name] !== undefined && row[name] !== null && row[name] !== "") {
      return row[name];
    }

    const underscored = name.replace(/ /g, "_");
    if (row[underscored] !== undefined && row[underscored] !== null && row[underscored] !== "") {
      return row[underscored];
    }

    const spaced = name.replace(/_/g, " ");
    if (row[spaced] !== undefined && row[spaced] !== null && row[spaced] !== "") {
      return row[spaced];
    }
  }
  return "";
}

function getRowId(row, index = 0) {
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
  return getField(row, ["Video_Link", "Video Link", "Link", "URL", "Url"]);
}

function isTruthyFlag(value) {
  return ["yes", "true", "1", "y"].includes(lower(value));
}

function isAISupported(row) {
  return isTruthyFlag(getField(row, ["AI_Supported", "AI Supported"]));
}

function hasProblematic(row) {
  return isTruthyFlag(getField(row, ["Problematic_History", "Problematic History"]));
}

function isRecent(row) {
  const recentFlag = getField(row, ["Recent", "Is_Recent", "Is Recent", "New"]);
  if (isTruthyFlag(recentFlag)) return true;

  const dateValue = getField(row, ["Date_Added", "Date Added", "Added", "Date"]);
  if (!dateValue) return false;

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return false;

  const now = new Date();
  const diffDays = (now - parsed) / (1000 * 60 * 60 * 24);
  return diffDays <= 60;
}

function getKeywordValuesByRow(row) {
  const values = [];

  CATEGORY_CONFIG.forEach(category => {
    if (category.type === "keyword") {
      values.push(...splitValues(getField(row, [category.key])));
    }
  });

  return values;
}

function getLanguageValuesByRow(row) {
  return splitValues(getField(row, ["Language"]));
}

function getKeywordSearchText(row) {
  return getKeywordValuesByRow(row).join(" ").toLowerCase();
}

function getLanguageSearchText(row) {
  return getLanguageValuesByRow(row).join(" ").toLowerCase();
}

function buildPill(text, className) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `pill ${className}`.trim();
  btn.textContent = text;
  return btn;
}

function setSearchFromToggle(value, mode) {
  const searchInput = document.getElementById("search");
  const searchMode = document.getElementById("searchMode");

  if (searchInput) searchInput.value = value || "";
  if (searchMode) searchMode.value = mode || "all";
}

function toggleKeyword(value) {
  if (activeKeyword === value) {
    activeKeyword = "";
    setSearchFromToggle("", "all");
  } else {
    activeKeyword = value;
    activeLanguage = "";
    setSearchFromToggle(value, "keywords");
  }
  renderList();
}

function toggleLanguage(value) {
  if (activeLanguage === value) {
    activeLanguage = "";
    setSearchFromToggle("", "all");
  } else {
    activeLanguage = value;
    activeKeyword = "";
    setSearchFromToggle(value, "language");
  }
  renderList();
}

function addPillsFromColumn(container, values, className, activeValue, toggleFn) {
  values.forEach(value => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const pill = buildPill(trimmed, className);

    if (trimmed === activeValue) {
      pill.classList.add("active-pill");
    }

    pill.addEventListener("click", () => toggleFn(trimmed));
    container.appendChild(pill);
  });
}

function getFilteredRows() {
  const searchText = lower(document.getElementById("search")?.value || "");
  const searchMode = document.getElementById("searchMode")?.value || "all";
  const favoritesOnly = !!document.getElementById("favoritesOnly")?.checked;
  const recentOnly = !!document.getElementById("recentOnly")?.checked;
  const excludeAI = !!document.getElementById("excludeAI")?.checked;
  const excludeProblematic = !!document.getElementById("excludeProblematic")?.checked;

  return allRows.filter((row, index) => {
    const rowId = getRowId(row, index);
    const title = lower(getTitle(row));
    const creator = lower(getCreator(row));
    const keywordValues = getKeywordValuesByRow(row);
    const languageValues = getLanguageValuesByRow(row);
    const keywordsText = getKeywordSearchText(row);
    const languageText = getLanguageSearchText(row);

    let matchesSearch = true;

    if (searchText) {
      if (searchMode === "title") {
        matchesSearch = title.includes(searchText);
      } else if (searchMode === "creator") {
        matchesSearch = creator.includes(searchText);
      } else if (searchMode === "keywords") {
        matchesSearch = keywordsText.includes(searchText);
      } else if (searchMode === "language") {
        matchesSearch = languageText.includes(searchText);
      } else {
        matchesSearch =
          title.includes(searchText) ||
          creator.includes(searchText) ||
          keywordsText.includes(searchText) ||
          languageText.includes(searchText);
      }
    }

    const matchesKeywordToggle =
      !activeKeyword ||
      keywordValues.some(value => lower(value) === lower(activeKeyword));

    const matchesLanguageToggle =
      !activeLanguage ||
      languageValues.some(value => lower(value) === lower(activeLanguage));

    return (
      matchesSearch &&
      matchesKeywordToggle &&
      matchesLanguageToggle &&
      (!favoritesOnly || favorites.has(rowId)) &&
      (!recentOnly || isRecent(row)) &&
      (!excludeAI || !isAISupported(row)) &&
      (!excludeProblematic || !hasProblematic(row))
    );
  });
}

function sortRows(rows) {
  const favoritesFirst = !!document.getElementById("favoritesFirst")?.checked;
  const recentFirst = !!document.getElementById("recentFirst")?.checked;

  return [...rows].sort((a, b) => {
    const aId = getRowId(a);
    const bId = getRowId(b);

    if (favoritesFirst) {
      const aFav = favorites.has(aId) ? 1 : 0;
      const bFav = favorites.has(bId) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;
    }

    if (recentFirst) {
      const aRecent = isRecent(a) ? 1 : 0;
      const bRecent = isRecent(b) ? 1 : 0;
      if (aRecent !== bRecent) return bRecent - aRecent;
    }

    return getTitle(a).localeCompare(getTitle(b));
  });
}

function buildGroupedKeywords(row) {
  const kw = document.createElement("div");
  kw.className = "keywords";

  CATEGORY_GROUPS.forEach(group => {
    const groupWrap = document.createElement("div");
    groupWrap.className = "keyword-group";

    const label = document.createElement("div");
    label.className = "keyword-group-label";
    label.textContent = group.label;

    const pillRow = document.createElement("div");
    pillRow.className = "keyword-group-pills";

    group.keys.forEach(key => {
      const config = CATEGORY_CONFIG.find(c => c.key === key);
      if (!config) return;

      const values = splitValues(getField(row, [key]));
      if (!values.length) return;

      values.forEach(value => {
        const trimmed = value.trim();
        if (!trimmed) return;

        const pill = buildPill(trimmed, config.className);

        if (
          (config.type === "language" && trimmed === activeLanguage) ||
          (config.type === "keyword" && trimmed === activeKeyword)
        ) {
          pill.classList.add("active-pill");
        }

        pill.addEventListener("click", () => {
          if (config.type === "language") {
            toggleLanguage(trimmed);
          } else {
            toggleKeyword(trimmed);
          }
        });

        pillRow.appendChild(pill);
      });
    });

    if (pillRow.children.length) {
      groupWrap.appendChild(label);
      groupWrap.appendChild(pillRow);
      kw.appendChild(groupWrap);
    }
  });

  return kw;
}

function renderList() {
  const list = document.getElementById("list");
  if (!list) return;

  list.innerHTML = "";

  const rows = sortRows(getFilteredRows());

  if (!rows.length) {
    list.innerHTML = `<div class="load-error">No results found.</div>`;
    return;
  }

  rows.forEach((row, i) => {
    const id = getRowId(row, i);

    const card = document.createElement("div");
    card.className = "card";

    const idBadge = document.createElement("div");
    idBadge.className = "card-id";
    idBadge.textContent = `Id: ${id}`;

    const top = document.createElement("div");
    top.className = "top";

    const topMain = document.createElement("div");
    topMain.className = "top-main";

    const star = document.createElement("button");
    star.type = "button";
    star.className = `star ${favorites.has(id) ? "fav" : ""}`;
    star.textContent = "★";
    star.setAttribute("aria-label", favorites.has(id) ? "Remove favorite" : "Add favorite");
    star.addEventListener("click", () => {
      if (favorites.has(id)) {
        favorites.delete(id);
      } else {
        favorites.add(id);
      }
      saveFavorites();
      renderList();
    });

    const textBlock = document.createElement("div");
    textBlock.className = "text-block";

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = getTitle(row) || "Untitled";

    const meta = document.createElement("div");
    meta.className = "meta";

    const creator = document.createElement("div");
    creator.className = "creator";
    creator.textContent = getCreator(row) ? `Creator: ${getCreator(row)}` : "";

    meta.appendChild(creator);
    textBlock.appendChild(title);
    textBlock.appendChild(meta);

    topMain.appendChild(star);
    topMain.appendChild(textBlock);
    top.appendChild(topMain);

    const kw = buildGroupedKeywords(row);

    const links = document.createElement("div");
    links.className = "links";

    const link = getLink(row);
    if (link) {
      const a = document.createElement("a");
      a.href = link;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "icon-link";
      a.textContent = "Open Link";
      links.appendChild(a);
    }

    const statusFlags = document.createElement("div");
    statusFlags.className = "status-flags";

    if (isAISupported(row)) {
      const f = document.createElement("div");
      f.className = "status-flag ai-flag";
      f.textContent = "AI-Supported";
      statusFlags.appendChild(f);
    }

    if (hasProblematic(row)) {
      const f = document.createElement("div");
      f.className = "status-flag warning-flag";
      f.textContent = "Problematic History";
      statusFlags.appendChild(f);
    }

    if (statusFlags.children.length) {
      links.appendChild(statusFlags);
    }

    card.appendChild(idBadge);
    card.appendChild(top);
    card.appendChild(kw);
    card.appendChild(links);

    list.appendChild(card);
  });
}

function resetAll() {
  const search = document.getElementById("search");
  const searchMode = document.getElementById("searchMode");

  if (search) search.value = "";
  if (searchMode) searchMode.value = "all";

  [
    "favoritesOnly",
    "favoritesFirst",
    "recentOnly",
    "recentFirst",
    "excludeAI",
    "excludeProblematic"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = false;
  });

  activeKeyword = "";
  activeLanguage = "";

  renderList();
}

function buildFavoritesEmailText() {
  const favoriteRows = allRows.filter((row, index) => favorites.has(getRowId(row, index)));

  if (!favoriteRows.length) {
    return "No favorites selected yet.";
  }

  return favoriteRows.map((row, index) => {
    const title = getTitle(row) || "Untitled";
    const creator = getCreator(row) || "Unknown creator";
    const link = getLink(row) || "";
    return `${index + 1}. ${title} — ${creator}${link ? `\n${link}` : ""}`;
  }).join("\n\n");
}

function setup() {
  const search = document.getElementById("search");
  const searchMode = document.getElementById("searchMode");
  const resetSearchBtn = document.getElementById("resetSearchBtn");
  const menuToggle = document.getElementById("menuToggle");
  const navBar = document.getElementById("navBar");

  if (search) {
    search.addEventListener("input", () => {
      activeKeyword = "";
      activeLanguage = "";
      renderList();
    });
  }

  if (searchMode) {
    searchMode.addEventListener("change", () => {
      activeKeyword = "";
      activeLanguage = "";
      renderList();
    });
  }

  if (resetSearchBtn) {
    resetSearchBtn.addEventListener("click", resetAll);
  }

  [
    "favoritesOnly",
    "favoritesFirst",
    "recentOnly",
    "recentFirst",
    "excludeAI",
    "excludeProblematic"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", renderList);
  });

  if (menuToggle && navBar) {
    menuToggle.addEventListener("click", () => {
      const isOpen = navBar.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  const copyFavoritesBtn = document.getElementById("copyFavoritesBtn");
  if (copyFavoritesBtn) {
    copyFavoritesBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(buildFavoritesEmailText());
        const oldText = copyFavoritesBtn.textContent;
        copyFavoritesBtn.textContent = "Copied!";
        setTimeout(() => {
          copyFavoritesBtn.textContent = oldText;
        }, 1400);
      } catch {
        alert("Could not copy favorites.");
      }
    });
  }

  const clearFavoritesBtn = document.getElementById("clearFavoritesBtn");
  if (clearFavoritesBtn) {
    clearFavoritesBtn.addEventListener("click", () => {
      favorites.clear();
      saveFavorites();
      renderList();
    });
  }

  const emailFavoritesBtn = document.getElementById("emailFavoritesBtn");
  const emailAddress = document.getElementById("emailAddress");

  if (emailFavoritesBtn && emailAddress) {
    emailFavoritesBtn.addEventListener("click", () => {
      const email = emailAddress.value.trim();
      if (!email) {
        alert("Please enter an email address.");
        return;
      }

      const subject = encodeURIComponent("Find a Rhyme Favorites");
      const body = encodeURIComponent(buildFavoritesEmailText());
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    });
  }
}

function loadCSV() {
  const list = document.getElementById("list");
  if (!list) return;

  Papa.parse(CSV_PATH, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: (res) => {
      allRows = res.data || [];
      renderList();
    },
    error: () => {
      list.innerHTML = `<div class="load-error">Could not load the database.</div>`;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setup();
  loadCSV();
});