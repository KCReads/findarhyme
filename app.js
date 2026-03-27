/***********************
 * GLOBAL STATE
 ***********************/
let data = [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

/***********************
 * LOAD CSV (PapaParse)
 ***********************/
Papa.parse("https://docs.google.com/spreadsheets/d/e/2PACX-1vRpcuB3lP6poEiXufRP7C_pdB3ZHz4WB82Zg5JmLSUg_BvjoC7xM5BDqG5PhdZOFg/pub?gid=1251597746&single=true&output=csv", {
  download: true,
  header: true,
  complete: function (results) {

    data = results.data.map((row, index) => ({
      id: index,
      title: row.title || "",
      keywords: row.keywords || "",
      creator: row.creator || "",
      video: row.video || "",
      supplemental: row.supplemental || ""
    }));

    render(data);
  }
});


/***********************
 * RENDER FUNCTION
 ***********************/
function render(items) {
  const list = document.getElementById("list");

  if (!list) {
    console.error("Missing #list element in HTML");
    return;
  }

  list.innerHTML = "";

  items.forEach((item, index) => {

    const isFav = favorites.includes(item.id);

    const li = document.createElement("li");

    li.innerHTML = `
      <div class="row-top">

        <button class="star-btn ${isFav ? "star-on" : "star-off"}"
          onclick="toggleFavorite(${item.id})">
          ★
        </button>

        <strong>${item.title}</strong> — ${item.creator}

      </div>

      <div class="row-keywords">
        ${item.keywords}
      </div>

      <div class="row-links">

        ${item.video
          ? `<a href="${item.video}" target="_blank">🎬 Video</a>`
          : ""
        }

        ${item.supplemental
          ? `<a href="${item.supplemental}" target="_blank">🔗 Supplemental</a>`
          : ""
        }

      </div>
    `;

    list.appendChild(li);
  });
}


/***********************
 * FAVORITES TOGGLE (IMPORTANT: window scope)
 ***********************/
window.toggleFavorite = function (id) {

  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));

  render(data);
};


/***********************
 * SEARCH + FILTER
 ***********************/
const searchInput = document.getElementById("search");
const searchMode = document.getElementById("searchMode");
const showFavoritesOnly = document.getElementById("favoritesOnly");

if (searchInput && searchMode) {
  searchInput.addEventListener("input", filterData);
  searchMode.addEventListener("change", filterData);
}

if (showFavoritesOnly) {
  showFavoritesOnly.addEventListener("change", filterData);
}

function filterData() {

  const value = (searchInput?.value || "").toLowerCase();
  const mode = searchMode?.value || "all";
  const favOnly = showFavoritesOnly?.checked;

  let filtered = data;

  // ⭐ FAVORITES FILTER
  if (favOnly) {
    filtered = filtered.filter(item => favorites.includes(item.id));
  }

  // 🔍 SEARCH FILTER
  filtered = filtered.filter(item => {

    const title = item.title.toLowerCase();
    const keywords = item.keywords.toLowerCase();
    const creator = item.creator.toLowerCase();

    if (!value) return true;

    if (mode === "title") return title.includes(value);
    if (mode === "keywords") return keywords.includes(value);
    if (mode === "creator") return creator.includes(value);

    // ALL
    return (
      title.includes(value) ||
      keywords.includes(value) ||
      creator.includes(value)
    );
  });

  render(filtered);
}
