const CSV_PATH = "songs.csv";

const CATEGORY_CONFIG = [
  { key: "Early Literacy Skill", className: "early-literacy-pill", type: "keyword" },
  { key: "Developmental Skill", className: "developmental-pill", type: "keyword" },
  { key: "Social Skill", className: "social-skill-pill", type: "keyword" },
  { key: "Theme", className: "theme-pill", type: "keyword" },
  { key: "Tune", className: "tune-pill", type: "keyword" },
  { key: "Language", className: "language-pill", type: "language" },
  { key: "Prop", className: "prop-pill", type: "keyword" },
  { key: "Music Genre", className: "music-genre-pill", type: "keyword" },
  { key: "Song Type", className: "song-type-pill", type: "keyword" },
  { key: "Recorded Music", className: "recorded-music-pill", type: "keyword" }
];

let allRows = [];
let activeKeyword = "";
let activeLanguage = "";

const favorites = new Set(JSON.parse(localStorage.getItem("favorites") || "[]"));

function saveFavorites() {
  localStorage.setItem("favorites", JSON.stringify([...favorites]));
}

function normalizeValue(value) {
  return String(value ?? "").trim();
}

function lower(value) {
  return normalizeValue(value).toLowerCase();
}

function splitMultiValue(value) {
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
  }
  return "";
}

function getTitleText(row) {
  return getField(row, ["Title", "title"]);
}

function getCreatorText(row) {
  return getField(row, ["Creator", "creator"]);
}

function getVideoLink(row) {
  return getField(row, ["Video Link", "video link", "Link", "URL", "Url"]);
}

function getRowId(row, index = 0) {
  const explicitId = getField(row, ["Id", "ID", "id"]);
  if (explicitId) return String(explicitId).trim();

  const title = normalizeValue(getTitleText(row));
  const creator = normalizeValue(getCreatorText(row));
  return `${title}__${creator}__${index}`;
}

function isTruthyFlag(value) {
  const v = lower(value);
  return ["yes", "true", "1", "y"].includes(v);
}

function isAISupported(row) {
  return isTruthyFlag(getField(row, ["AI-Supported", "AI Supported", "AISupported"]));
}

function hasProblematicHistory(row) {
  return isTruthyFlag(getField(row, ["Problematic History", "ProblematicHistory"]));
}

function isRecent(row) {
  const recentFlag = getField(row, ["Recent", "Is Recent", "New"]);
  if (isTruthyFlag(recentFlag)) return true;

  const dateValue = getField(row, ["Date Added", "Added", "Date"]);
  if (!dateValue) return false;

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return false;

  const now = new Date();
  const diffDays = (now - parsed) / (1000 * 60 * 60 * 24);
  return diffDays <= 60;
}

function getAllKeywordValues(row) {
  const values = [];

  CATEGORY_CONFIG.forEach(category => {
    if (category.type === "keyword") {
      values.push(...splitMultiValue(getField(row, [category.key])));
    }
  });

  return values;
}

function getAllLanguageValues(row) {
  return splitMultiValue(getField(row, ["Language"]));
}

function getAllKeywordSearchText(row) {
  return getAllKeywordValues(row).join(" ").toLowerCase();
}

function getAllLanguageSearchText(row) {
  return getAllLanguageValues(row).join(" ").toLowerCase();
}

function buildPill(text, className) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `pill ${className}`.trim();
  btn.textContent = text;
  return btn;
}

function toggleKeyword(value) {
  if (activeKeyword === value) {
    activeKeyword = "";
  } else {
    activeKeyword = value;
    activeLanguage = "";
  }
  renderList();
}

function toggleLanguage(value) {
  if (activeLanguage === value) {
    activeLanguage = "";
  } else {
    activeLanguage = value;
    activeKeyword = "";
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
    const title = lower(getTitleText(row));
    const creator = lower(getCreatorText(row));
    const keywordsText = getAllKeywordSearchText(row);
    const languageText = getAllLanguageSearchText(row);

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

    const rowKeywords = getAllKeywordValues(row);
    const rowLanguages = getAllLanguageValues(row);

    const matchesKeywordToggle =
      !activeKeyword ||
      rowKeywords.some(value => value.toLowerCase() === activeKeyword.toLowerCase());

    const matchesLanguageToggle =
      !activeLanguage ||
      rowLanguages.some(value => value.toLowerCase() === activeLanguage.toLowerCase());

    return (
      matchesSearch &&
      matchesKeywordToggle &&
      matchesLanguageToggle &&
      (!favoritesOnly || favorites.has(rowId)) &&
      (!recentOnly || isRecent(row)) &&
      (!excludeAI || !isAISupported(row)) &&
      (!excludeProblematic || !hasProblematicHistory(row))
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

    return getTitleText(a).localeCompare(getTitleText(b));
  });
}

function renderList() {
  const list = document.getElementById("list");
  if (!list) return;

  list.innerHTML = "";

  const filtered = sortRows(getFilteredRows());

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "load-error";
    empty.textContent = "No results found.";
    list.appendChild(empty);
    return;
  }

  filtered.forEach((row, index) => {
    const rowId = getRowId(row, index);
    const title = getTitleText(row);
    const creator = getCreatorText(row);
    const videoLink = getVideoLink(row);

    const card = document.createElement("article");
    card.className = "card";

    const idBadge = document.createElement("div");
    idBadge.className = "card-id";
    idBadge.textContent = `Id: ${rowId}`;

    const top = document.createElement("div");
    top.className = "top";

    const topMain = document.createElement("div");
    topMain.className = "top-main";

    const star = document.createElement("button");
    star.type = "button";
    star.className = `star ${favorites.has(rowId) ? "fav" : ""}`;
    star.setAttribute("aria-label", favorites.has(rowId) ? "Remove favorite" : "Add favorite");
    star.textContent = "★";
    star.addEventListener("click", () => {
      if (favorites.has(rowId)) {
        favorites.delete(rowId);
      } else {
        favorites.add(rowId);
      }
      saveFavorites();
      renderList();
    });

    const textBlock = document.createElement("div");
    textBlock.className = "text-block";

    const titleDiv = document.createElement("div");
    titleDiv.className = "title";
    titleDiv.textContent = title || "Untitled";

    const meta = document.createElement("div");
    meta.className = "meta";

    const creatorDiv = document.createElement("div");
    creatorDiv.className = "creator";
    creatorDiv.textContent = creator ? `Creator: ${creator}` : "";

    meta.appendChild(creatorDiv);
    textBlock.appendChild(titleDiv);
    textBlock.appendChild(meta);

    topMain.appendChild(star);
    topMain.appendChild(textBlock);
    top.appendChild(topMain);

    const keywordsCol = document.createElement("div");
    keywordsCol.className = "keywords";

    CATEGORY_CONFIG.forEach(category => {
      const values = splitMultiValue(getField(row, [category.key]));
      if (!values.length) return;

      if (category.type === "language") {
        addPillsFromColumn(
          keywordsCol,
          values,
          category.className,
          activeLanguage,
          toggleLanguage
        );
      } else {
        addPillsFromColumn(
          keywordsCol,
          values,
          category.className,
          activeKeyword,
          toggleKeyword
        );
      }
    });

    const links = document.createElement("div");
    links.className = "links";

    if (videoLink) {
      const link = document.createElement("a");
      link.className = "icon-link";
      link.href = videoLink;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Open Link";
      links.appendChild(link);
    }

    const statusFlags = document.createElement("div");
    statusFlags.className = "status-flags";

    if (isAISupported(row)) {
      const aiFlag = document.createElement("div");
      aiFlag.className = "status-flag ai-flag";
      aiFlag.textContent = "AI-Supported";
      statusFlags.appendChild(aiFlag);
    }

    if (hasProblematicHistory(row)) {
      const warningFlag = document.createElement("div");
      warningFlag.className = "status-flag warning-flag";
      warningFlag.textContent = "Problematic History";
      statusFlags.appendChild(warningFlag);
    }

    if (statusFlags.children.length) {
      links.appendChild(statusFlags);
    }

    card.appendChild(idBadge);
    card.appendChild(top);
    card.appendChild(keywordsCol);
    card.appendChild(links);

    list.appendChild(card);
  });
}

function resetAllFilters() {
  const idsToClear = [
    "favoritesOnly",
    "favoritesFirst",
    "recentOnly",
    "recentFirst",
    "excludeAI",
    "excludeProblematic"
  ];

  const search = document.getElementById("search");
  const searchMode = document.getElementById("searchMode");

  if (search) search.value = "";
  if (searchMode) searchMode.value = "all";

  idsToClear.forEach(id => {
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
    const title = getTitleText(row) || "Untitled";
    const creator = getCreatorText(row) || "Unknown creator";
    const link = getVideoLink(row) || "";
    return `${index + 1}. ${title} — ${creator}${link ? `\n${link}` : ""}`;
  }).join("\n\n");
}

function setupControls() {
  const menuToggle = document.getElementById("menuToggle");
  const navBar = document.getElementById("navBar");

  if (menuToggle && navBar) {
    menuToggle.addEventListener("click", () => {
      const isOpen = navBar.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  const search = document.getElementById("search");
  const searchMode = document.getElementById("searchMode");
  const resetSearchBtn = document.getElementById("resetSearchBtn");

  if (search) search.addEventListener("input", renderList);
  if (searchMode) searchMode.addEventListener("change", renderList);
  if (resetSearchBtn) resetSearchBtn.addEventListener("click", resetAllFilters);

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
    complete: (results) => {
      allRows = results.data || [];
      renderList();
    },
    error: () => {
      list.innerHTML = '<div class="load-error">Could not load the database.</div>';
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupControls();
  loadCSV();
});