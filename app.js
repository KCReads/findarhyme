const TSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRpcuB3lP6poEiXufRP7C_pdB3ZHz4WB82Zg5JmLSUg_BvjoC7xM5BDqG5PhdZOFg/pub?gid=1251597746&single=true&output=tsv";

let data = [];
let favorites = new Set();

const listEl = document.getElementById("list");
const searchEl = document.getElementById("search");
const modeEl = document.getElementById("searchMode");
const favEl = document.getElementById("favoritesOnly");

/* =========================
   LOAD TSV (GOOGLE SHEETS)
========================= */
Papa.parse(TSV_URL, {
  download: true,
  header: true,
  delimiter: "\t",
  skipEmptyLines: true,

  complete: function (results) {
    data = cleanData(results.data);
    renderAll();
  }
});

/* =========================
   CLEAN HEADERS (CRITICAL)
========================= */
function cleanData(rows) {
  return rows
    .map(row => {
      const clean = {};

      Object.keys(row).forEach(key => {
        if (!key) return;
        clean[key.trim().toLowerCase()] = row[key];
      });

      return clean;
    })
    .filter(row => row.title);
}

/* =========================
   CREATE CARD ONCE
========================= */
function createCard(item, index) {
  const id = item.id || item.title || index;

  const card = document.createElement("div");
  card.className = "card";
  card.dataset.id = id;

  const isFav = favorites.has(id);

  card.innerHTML = `
    <div class="top">

      <button class="star ${isFav ? "on" : "off"}">★</button>

      <div class="title-block">
        <div class="title"></div>
        <div class="creator"></div>
      </div>

      <button class="expand">▼</button>

    </div>

    <div class="body hidden">
      <div class="keywords"></div>

      <div class="links">
        ${item.link ? `<a href="${item.link}" target="_blank">Watch</a>` : ""}
      </div>
    </div>
  `;

  /* fill text safely */
  card.querySelector(".title").textContent = item.title || "";
  card.querySelector(".creator").textContent = item.creator || "";
  card.querySelector(".keywords").textContent = item.keywords || "";

  /* STAR */
  const starBtn = card.querySelector(".star");

  starBtn.addEventListener("click", () => {
    toggleFavorite(id, starBtn);
  });

  /* EXPAND */
  const expandBtn = card.querySelector(".expand");
  const body = card.querySelector(".body");

  expandBtn.addEventListener("click", () => {
    body.classList.toggle("hidden");
  });

  return card;
}

/* =========================
   FAVORITES (NO RE-RENDER)
========================= */
function toggleFavorite(id, btn) {
  if (favorites.has(id)) {
    favorites.delete(id);
    btn.classList.remove("on");
    btn.classList.add("off");
  } else {
    favorites.add(id);
    btn.classList.add("on");
    btn.classList.remove("off");
  }
}

/* =========================
   RENDER ALL (ONCE ONLY)
========================= */
function renderAll() {
  listEl.innerHTML = "";

  data.forEach((item, index) => {
    const card = createCard(item, index);
    listEl.appendChild(card);
  });

  applyFilters();
}

/* =========================
   FILTER (HIDE / SHOW ONLY)
========================= */
function applyFilters() {
  const q = searchEl.value.toLowerCase();
  const mode = modeEl.value;
  const favOnly = favEl.checked;

  const cards = listEl.querySelectorAll(".card");

  cards.forEach(card => {
    const id = card.dataset.id;

    const item = data.find(d =>
      (d.id || d.title || "").toString() === id
    );

    if (!item) return;

    let match = true;

    if (q) {
      if (mode === "title") {
        match = (item.title || "").toLowerCase().includes(q);
      } else if (mode === "creator") {
        match = (item.creator || "").toLowerCase().includes(q);
      } else if (mode === "keywords") {
        match = (item.keywords || "").toLowerCase().includes(q);
      } else {
        match =
          (item.title || "").toLowerCase().includes(q) ||
          (item.creator || "").toLowerCase().includes(q) ||
          (item.keywords || "").toLowerCase().includes(q);
      }
    }

    if (favOnly) {
      match = match && favorites.has(id);
    }

    card.style.display = match ? "block" : "none";
  });
}

/* =========================
   EVENTS
========================= */
searchEl.addEventListener("input", applyFilters);
modeEl.addEventListener("change", applyFilters);
favEl.addEventListener("change", applyFilters);
