import "./style.css";

const app = document.querySelector("#app");
const gameModules = import.meta.glob("../games/*/config.json", {
  eager: true,
  import: "default",
  query: "?raw"
});

function parseConfig(raw) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Configuração de jogo inválida:", error);
    return null;
  }
}

const games = Object.entries(gameModules)
  .map(([configPath, raw]) => {
    const config = parseConfig(raw);
    if (!config || !config.name) return null;
    const folder = configPath.replace(/\/config\.json$/, "");
    return {
      id: folder.split("/").pop(),
      folder,
      name: config.name,
      image: config.image || "",
      description: config.description || "Sem descrição.",
      category: config.category || "Outros"
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

let searchTerm = "";
let activeCategory = "Todos";
let selectedGame = null;

const categories = ["Todos", ...new Set(games.map(game => game.category))];

function safeText(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function gameCard(game) {
  const image = game.image
    ? `<img src="${safeText(game.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">`
    : "";
  return `
    <article class="game-card">
      <button class="cover-button" data-play="${safeText(game.id)}" aria-label="Jogar ${safeText(game.name)}">
        ${image}
        <div class="cover-fallback" ${game.image ? 'style="display:none"' : ""}><span>▶</span></div>
        <span class="play-overlay"><span>▶</span> Jogar agora</span>
      </button>
      <div class="game-info">
        <div class="game-meta"><span class="category">${safeText(game.category)}</span><span class="tiny-dot"></span><span>HTML5</span></div>
        <h2>${safeText(game.name)}</h2>
        <p>${safeText(game.description)}</p>
      </div>
    </article>`;
}

function render() {
  const visibleGames = games.filter(game => {
    const matchesSearch = `${game.name} ${game.description} ${game.category}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "Todos" || game.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  app.innerHTML = `
    <header class="topbar">
      <a class="brand" href="#" aria-label="Pixel Portal início">
        <span class="brand-mark">P<span>✦</span></span>
        <span>PIXEL<span class="brand-light">PORTAL</span></span>
      </a>
      <div class="topbar-right"><span class="status-dot"></span><span>ARCADE ONLINE</span></div>
    </header>
    <main>
      <section class="hero">
        <div class="hero-copy">
          <div class="eyebrow"><span class="eyebrow-line"></span> SUA PRÓXIMA FASE COMEÇA AQUI</div>
          <h1>Jogue. <span>Explore.</span><br>Repita.</h1>
          <p>Jogos rápidos, ideias criativas e diversão direto no navegador. Escolha um jogo e dê o play.</p>
          <a class="hero-link" href="#biblioteca">EXPLORAR JOGOS <span>↓</span></a>
        </div>
        <div class="hero-art" aria-hidden="true">
          <div class="art-grid"></div>
          <div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>
          <div class="pixel-star star-one">✦</div><div class="pixel-star star-two">✧</div>
          <div class="hero-console"><div class="console-screen"><div class="screen-sun"></div><div class="screen-mountain mountain-one"></div><div class="screen-mountain mountain-two"></div><div class="screen-ground"></div></div><div class="console-controls"><span class="dpad">✚</span><span class="console-buttons"><i></i><i></i></span></div></div>
          <div class="float-tag tag-left">INSERT COIN</div><div class="float-tag tag-right">PLAYER 01</div>
          <div class="art-caption">PRESS START <span>_</span></div>
        </div>
      </section>
      <section class="library" id="biblioteca">
        <div class="section-heading">
          <div><div class="eyebrow"><span class="eyebrow-line"></span> A COLEÇÃO</div><h2>Biblioteca <span>de jogos</span></h2></div>
          <div class="game-count"><strong>${games.length.toString().padStart(2, "0")}</strong><span>JOGOS<br>DISPONÍVEIS</span></div>
        </div>
        <div class="toolbar">
          <div class="search-wrap"><span class="search-icon">⌕</span><input id="search" type="search" placeholder="Buscar um jogo..." value="${safeText(searchTerm)}" aria-label="Buscar jogos"><kbd>/</kbd></div>
          <div class="filters">${categories.map(category => `<button class="filter ${activeCategory === category ? "active" : ""}" data-category="${safeText(category)}">${safeText(category)}</button>`).join("")}</div>
        </div>
        <div class="games-grid">${visibleGames.map(gameCard).join("")}</div>
        ${visibleGames.length === 0 ? `<div class="empty-state"><span>⌁</span><h3>Nenhum jogo encontrado</h3><p>Tente outra busca ou categoria.</p></div>` : ""}
        <div class="library-foot"><span><span class="status-dot"></span> TODOS OS JOGOS EM UM SÓ LUGAR</span><span>FEITO PARA JOGAR <b>✦</b></span></div>
      </section>
    </main>
    <footer><a class="brand footer-brand" href="#"><span class="brand-mark">P<span>✦</span></span><span>PIXEL<span class="brand-light">PORTAL</span></span></a><p>Um pequeno portal para grandes partidas.</p><span class="footer-copy">© ${new Date().getFullYear()} PIXEL PORTAL</span></footer>
    ${selectedGame ? `
      <div class="game-modal" role="dialog" aria-modal="true" aria-label="${safeText(selectedGame.name)}">
        <div class="modal-bar"><div class="modal-title"><span class="status-dot"></span><strong>${safeText(selectedGame.name)}</strong></div><div class="modal-actions"><button id="fullscreen" class="modal-control" title="Tela cheia">⛶ <span>TELA CHEIA</span></button><button id="close-game" class="close-game" aria-label="Fechar jogo">✕</button></div></div>
        <iframe id="game-frame" title="${safeText(selectedGame.name)}" src="${selectedGame.folder}/index.html" allow="fullscreen; gamepad" loading="eager"></iframe>
        <div class="modal-bottom"><span>ESC PARA FECHAR</span><span>DIVIRTA-SE <b>✦</b></span></div>
      </div>` : ""}
  `;

  document.querySelector("#search").addEventListener("input", event => {
    searchTerm = event.target.value;
    const pos = event.target.selectionStart;
    render();
    const input = document.querySelector("#search");
    input.focus();
    input.setSelectionRange(pos, pos);
  });
  document.querySelectorAll("[data-category]").forEach(button => button.addEventListener("click", () => {
    activeCategory = button.dataset.category;
    render();
  }));
  document.querySelectorAll("[data-play]").forEach(button => button.addEventListener("click", () => {
    selectedGame = games.find(game => game.id === button.dataset.play);
    render();
    document.querySelector("#close-game")?.focus();
  }));
  document.querySelector("#close-game")?.addEventListener("click", () => {
    selectedGame = null;
    render();
  });
  document.querySelector("#fullscreen")?.addEventListener("click", async () => {
    const frame = document.querySelector("#game-frame");
    try {
      if (frame.requestFullscreen) await frame.requestFullscreen();
    } catch (error) {
      console.warn("Tela cheia não disponível:", error);
    }
  });
}

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && selectedGame) {
    selectedGame = null;
    render();
  }
  if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
    event.preventDefault();
    document.querySelector("#search")?.focus();
  }
});

render();
