const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRpcuB3lP6poEiXufRP7C_pdB3ZHz4WB82Zg5JmLSUg_BvjoC7xM5BDqG5PhdZOFg/pub?gid=1251597746&single=true&output=csv";

let data = [];

// Load CSV
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

// Render list
function render(items) {
  const list = document.getElementById("list");
  list.innerHTML = "";

  if (!items.length) {
    list.innerHTML = "<p>No results found</p>";
    return;
  }

  const favs = JSON.parse(localStorage.getItem("favs") || "[]");

  items.forEach((item, index) => {
    const isFav = favs.includes(index);

    const li = document.createElement("li");

    li.innerHTML = `
      <div class="row-header" onclick="toggleDetails(this)">
        <button class="${isFav ? 'fav' : ''}" onclick="toggleFav(${index}); event.stopPropagation();">★</button>
        <div class="header-text">${item.title} - ${item.creator}</div>
      </div>

      <div class="row-details">
        <div>🎵 Keywords: ${item.keywords}</div>

        <div class="links-row">
       <div class="links-row">

  <div class="links-row">

  <div class="video-block">
  <iframe
    width="100%"
    height="200"
    src="${getEmbedUrl(item.videoLink)}"
    frameborder="0"
    allowfullscreen
  ></iframe>
</div>

  ${item.supplementalLink ? `
    <a class="link-btn supp-btn" href="${item.supplementalLink}" target="_blank">
      🔗 Supplemental
    </a>
  ` : `
    <span class="link-empty">🔗 No Supplemental Link</span>
  `}

</div>
        </div>
      </div>
    `;

    list.appendChild(li);
  });
}

// Search
const searchInput = document.getElementById("search");
const searchMode = document.getElementById("searchMode");

searchInput.addEventListener("input", filterData);
searchMode.addEventListener("change", filterData);

function filterData() {
  const value = searchInput.value.toLowerCase();
  const mode = searchMode.value;

  const filtered = data.filter(item => {

    const title = (item.title || "").toLowerCase();
    const keywords = (item.keywords || "").toLowerCase();
    const creator = (item.creator || "").toLowerCase();

    if (mode === "title") return title.includes(value);
    if (mode === "keywords") return keywords.includes(value);
    if (mode === "creator") return creator.includes(value);

    // default = all
    return (
      title.includes(value) ||
      keywords.includes(value) ||
      creator.includes(value)
    );
  });

  render(filtered);
}

// Favorites
function toggleFav(index) {
  let favs = JSON.parse(localStorage.getItem("favs") || "[]");

  if (favs.includes(index)) {
    favs = favs.filter(i => i !== index);
  } else {
    favs.push(index);
  }

  localStorage.setItem("favs", JSON.stringify(favs));
  render(data);
}

// Accordion
function toggleDetails(header) {
  const details = header.nextElementSibling;

  if (details.style.maxHeight) {
    details.style.maxHeight = null;
  } else {
    details.style.maxHeight = details.scrollHeight + "px";
  }
  // Inline Video
  function getEmbedUrl(url) {
  if (!url) return "";

  // YouTube standard link → embed
  const match = url.match(/v=([^&]+)/);
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }

  return url;
}
}
