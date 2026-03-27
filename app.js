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
  complete: function(results) {
    data = results.data;
    render();
  }
});

/* ======================
   RENDER
====================== */
function render() {
  listEl.innerHTML = "";

  let filtered = data.filter(item => {
    const q = searchEl.value.toLowerCase();
    const mode = modeEl.value;

    let match = true;

    if (q) {
      if (mode === "title") match = item.title?.toLowerCase().includes(q);
      else if (mode === "creator") match = item.creator?.toLowerCase().includes(q);
      else if (mode === "keywords") match = item.keywords?.toLowerCase().includes(q);
      else {
        match =
          item.title?.toLowerCase().includes(q) ||
          item.creator?.toLowerCase().includes(q) ||
          item.keywords?.toLowerCase().includes(q);
      }
    }

    if (favEl.checked) {
      match = match && favorites.has(item.title);
    }

    return match;
  });

  filtered.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "card";

    const isFav = favorites.has(item.title);

    card.innerHTML = `
      <div class="top">
        <button class="star ${isFav ? "on" : "off"}" data-id="${item.title}">★</button>

        <div class="title-block">
          <div class="title">${item.title}</div>
          <div class="creator">${item.creator}</div>
        </div>

        <button class="expand">▼</button>
      </div>

      <div class="body hidden">
        <div><b>Keywords:</b> ${item.keywords}</div>

        <div class="links">
          ${item.link ? `<a href="${item.link}" target="_blank">Watch</a>` : ""}
        </div>
      </div>
    `;

    /* STAR */
    card.querySelector(".star").addEventListener("click", (e) => {
      const id = e.target.dataset.id;

      if (favorites.has(id)) {
        favorites.delete(id);
      } else {
        favorites.add(id);
      }

      render();
    });

    /* EXPAND */
    card.querySelector(".expand").addEventListener("click", () => {
      card.querySelector(".body").classList.toggle("hidden");
    });

    listEl.appendChild(card);
  });
}

/* ======================
   EVENTS
====================== */
searchEl.addEventListener("input", render);
modeEl.addEventListener("change", render);
favEl.addEventListener("change", render);
