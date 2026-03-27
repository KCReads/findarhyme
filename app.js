const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRpcuB3lP6poEiXufRP7C_pdB3ZHz4WB82Zg5JmLSUg_BvjoC7xM5BDqG5PhdZOFg/pub?gid=1251597746&single=true&output=csv";

let data = [];

// LOAD DATA
Papa.parse(sheetURL, {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: function(results) {

    data = results.data.map(row => ({
      title: row["Title"] || "",
      keywords: row["Keywords"] || "",
      creator: row["Creator"] || "",
      videoLink: row["Video"] || "",
      supplementalLink: row["Supplemental"] || ""
    }));

    render(data);
  }
});

// ELEMENTS
const searchInput = document.getElementById("search");
const searchMode = document.getElementById("searchMode");

// EVENTS
searchInput.addEventListener("input", filterData);
searchMode.addEventListener("change", filterData);

// SEARCH
function filterData() {
  const value = searchInput.value.toLowerCase();
  const mode = searchMode.value;

  const filtered = data.filter(item => {

    const title = item.title.toLowerCase();
    const keywords = item.keywords.toLowerCase();
    const creator = item.creator.toLowerCase();

    if (value.trim() === "") return true;

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

// RENDER
function render(items) {
  const list = document.getElementById("list");
  list.innerHTML = "";

  items.forEach(item => {

    const isFav = favorites.includes(item.id);

    const li = document.createElement("li");

    li.innerHTML = `
      <!-- ⭐ TOP ROW (STAR + TITLE) -->
      <div>
        <button class="star-btn ${isFav ? 'star-on' : 'star-off'}"
          onclick="toggleFavorite(${item.id})">
          ★
        </button>

        <strong>${item.title}</strong> — ${item.creator}
      </div>

      <!-- KEYWORDS -->
      <div>
        Keywords: ${item.keywords}
      </div>

      <!-- LINKS -->
      <div class="links">

        <a href="${item.videoLink}" target="_blank">
          🎬 Video
        </a>

        ${
          item.supplementalLink
          ? `<a href="${item.supplementalLink}" target="_blank">
               🔗 Supplemental
             </a>`
          : `<span>🔗 No Supplemental</span>`
        }

      </div>
    `;

    list.appendChild(li);
  });
}
