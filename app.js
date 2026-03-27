
/***********************
 * GLOBAL STATE
 ***********************/
let data = [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

/***********************
 * LOAD CSV
 ***********************/
Papa.parse("https://docs.google.com/spreadsheets/d/e/2PACX-1vRpcuB3lP6poEiXufRP7C_pdB3ZHz4WB82Zg5JmLSUg_BvjoC7xM5BDqG5PhdZOFg/pub?gid=1251597746&single=true&output=csv", {
  download: true,
  header: true,
  complete: function (results) {

    data = results.data.map((row) => ({
      id: String(row.id), // your 1001 column
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
 * RENDER
 ***********************/
function render(items) {
  const list = document.getElementById("list");
  if (!list) return;

  list.innerHTML = "";

  items.forEach((item) => {

    const isFav = favorites.includes(item.id);

    const li = document.createElement("li");

    li.innerHTML = `
      <div class="row-top">

        <button class="star-btn ${isFav ? "star-on" : "star-off"}"
          onclick="toggleFavorite('${item.id}')">
          ★
        </button>

        <strong>${item.title}</strong> — ${item.creator}

        <button class="expand-btn" onclick="toggleExpand(this)">
          ▼
        </button>

      </div>

      <div class="row-body hidden">

        <div class="keywords">
          ${item.keywords}
        </div>

        <div class="links">
          ${item.video
            ? `<a href="${item.video}" target="_blank">🎬 Video</a>`
            : ""
          }

          ${item.supplemental
            ? `<a href="${item.supplemental}" target="_blank">🔗 Supplemental</a>`
            : ""
          }
        </div>

      </div>
    `;

    list.appendChild(li);
  });
}


/***********************
 * FAVORITES
 ***********************/
window.toggleFavorite = function(id) {
  id = String(id);

  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));
  render(data);
};


/***********************
 * EXPAND / COLLAPSE ROW
 ***********************/
window.toggleExpand = function(btn) {
  const body = btn.closest("li").querySelector(".row-body");
  body.classList.toggle("hidden");
};


/***********************
 * SEARCH + FILTERS
 ***********************/
const searchInput = document.getElementById("search");
const searchMode = document.getElementById("searchMode");
const favoritesOnly = document.getElementById("favoritesOnly");

if (searchInput) searchInput.addEventListener("input", filterData);
if (searchMode) searchMode.addEventListener("change", filterData);
if (favoritesOnly) favoritesOnly.addEventListener("change", filterData);


function filterData() {

  const value = (searchInput?.value || "").toLowerCase();
  const mode = searchMode?.value || "all";
  const favOnly = favoritesOnly?.checked;

  let filtered = data;

  // ⭐ FAVORITES FILTER
  if (favOnly) {
    filtered = filtered.filter(item => favorites.includes(item.id));
  }

  // 🔍 SEARCH FILTER
  filtered = filtered.filter(item => {

    if (!value) return true;

    const title = item.title.toLowerCase();
    const keywords = item.keywords.toLowerCase();
    const creator = item.creator.toLowerCase();

    if (mode === "title") return title.includes(value);
    if (mode === "keywords") return keywords.includes(value);
    if (mode === "creator") return creator.includes(value);

    return (
      title.includes(value) ||
      keywords.includes(value) ||
      creator.includes(value)
    );
  });

  render(filtered);
}
