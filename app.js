let data = [];
let favorites = new Set();

const listEl = document.getElementById("list");
const searchEl = document.getElementById("search");
const modeEl = document.getElementById("searchMode");
const favEl = document.getElementById("favoritesOnly");

/* ======================
   LOAD CSV
====================== */
Papa.parse("data.csv", {
  download: true,
  header: true,
  complete: function (results) {
    data = results.data
      .filter(item => item && item.title); // safety cleanup

    renderAll();
  }
});

/* ======================
   CREATE CARD (ONCE ONLY)
====================== */
function createCard(item, index) {
  const id = item.id || item.title || index;

  const card = document.createElement("div");
  card.className = "card";
  card.dataset.id = id;

  card.innerHTML = `
    <div class="top">

      <button class="star off">★</button>

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

  /* init star state */
  updateStarUI(id, starBtn);

  return card;
}

/* ======================
   FAVORITES
====================== */
function toggleFavorite(id, starBtn) {
  if (favorites.has(id)) {
    favorites.delete(id);
  } else {
    favorites.add(id);
  }

  updateStarUI(id, starBtn);
}

/* update ONLY one star */
function updateStarUI(id, starBtn) {
  const isFav = favorites.has(id);

  starBtn.classList.toggle("on", isFav);
  starBtn.classList.toggle("off", !isFav);
}

/* ======================
   RENDER ALL (ONLY ON LOAD / FILTER CHANGE)
====================== */
function renderAll() {
  listEl.innerHTML = "";

  data.forEach((item, index) => {
    const card = createCard(item, index);
    listEl.appendChild(card);
  });

  applyFilters(); // apply initial filter
}

/* ======================
   FILTER (HIDE / SHOW ONLY)
====================== */
function applyFilters() {
  const q = searchEl.value.toLowerCase();
  const mode = modeEl.value;
  const favOnly = favEl.checked;

  const cards = listEl.querySelectorAll(".card");

  cards.forEach(card => {
    const id = card.dataset.id;

    const item = data.find(d =>
      (d.id || d.title) === id
    );

    if (!item) return;

    let match = true;

    if (q) {
      if (mode === "title") {
        match = item.title?.toLowerCase().includes(q);
      } else if (mode === "creator") {
        match = item.creator?.toLowerCase().includes(q);
      } else if (mode === "keywords") {
        match = item.keywords?.toLowerCase().includes(q);
      } else {
        match =
          item.title?.toLowerCase().includes(q) ||
          item.creator?.toLowerCase().includes(q) ||
          item.keywords?.toLowerCase().includes(q);
      }
    }

    if (favOnly) {
      match = match && favorites.has(id);
    }

    card.style.display = match ? "block" : "none";
  });
}

/* ======================
   EVENTS
====================== */
searchEl.addEventListener("input", applyFilters);
modeEl.addEventListener("change", applyFilters);
favEl.addEventListener("change", applyFilters);
