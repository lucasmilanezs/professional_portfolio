const GH_USER = "lucasmilanezs";
const MAX_PROJECTS = 12;

// carousel
const elTrack = document.getElementById("carouselTrack");
const elDots = document.getElementById("carouselDots");
const elStatus = document.getElementById("carouselStatus");
const elPrev = document.getElementById("prevBtn");
const elNext = document.getElementById("nextBtn");
const elViewport = document.getElementById("carouselViewport");

// i18n
const elLangToggle = document.getElementById("langToggle");

// email
const elEmailWrap = document.getElementById("emailWrap");
const elEmailBtn = document.getElementById("emailBtn");
const elEmailPop = document.getElementById("emailPop");
const elEmailText = document.getElementById("emailText");
const elCopyEmailBtn = document.getElementById("copyEmailBtn");

// toast
const elToast = document.getElementById("toast");

// stack elements
const elStackLangBadges = document.getElementById("stackLangBadges");
const elStackFwBadges = document.getElementById("stackFwBadges");
const elStackToolBadges = document.getElementById("stackToolBadges");

let projects = [];
let lang = loadLang();
let lastMouse = { x: 0, y: 0 };

document.addEventListener("mousemove", (e) => {
  lastMouse = { x: e.clientX, y: e.clientY };
});

// ---------- i18n helpers ----------
function t(key, args) {
  const dict = window.I18N?.[lang] || window.I18N?.pt || {};
  const val = dict[key];
  if (typeof val === "function") return val(args);
  if (typeof val === "string") return val;
  return key;
}

function loadLang() {
  const saved = localStorage.getItem("portfolio_lang");
  return saved === "en" ? "en" : "pt";
}

function setLang(next) {
  lang = next;
  localStorage.setItem("portfolio_lang", lang);

  document.documentElement.lang = lang === "en" ? "en" : "pt-BR";
  document.title = lang === "en" ? "Lucas Milanez — Portfolio" : "Lucas Milanez — Portfólio";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    el.setAttribute("placeholder", t(key));
  });

  elPrev.setAttribute("aria-label", t("carousel_prev_aria"));
  elNext.setAttribute("aria-label", t("carousel_next_aria"));

  renderCarousel();
  renderStack();
}

function updateToggleUI() {
  elLangToggle.setAttribute("aria-checked", lang === "en" ? "true" : "false");
}

// ---------- formatting helpers ----------
function sanitize(text) {
  if (!text) return "";
  return String(text).replace(/[<>]/g, "");
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(lang === "en" ? "en-US" : "pt-BR", { year: "numeric", month: "short" });
  } catch {
    return "";
  }
}

// ---------- carousel (3 per page) ----------
const PER_PAGE = 3;
let pageIndex = 0; // 0..(pages-1)

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function buildProjectCard(p, absoluteIndex) {
  const name = sanitize(p.name);
  const desc = sanitize(p.description) || t("project_no_desc");
  const repoUrl = p.html_url;

  const homepage = p.homepage && String(p.homepage).trim() ? String(p.homepage).trim() : null;

  const langBadge = t("project_lang_badge", sanitize(p.language) || "—");
  const updatedBadge = t("project_updated_badge", formatDate(p.updated_at));
  const starsBadge = t("project_stars_badge", typeof p.stargazers_count === "number" ? p.stargazers_count : 0);

  const card = document.createElement("article");
  card.className = "project-card";
  card.innerHTML = `
    <div class="project-top">
      <div>
        <h3>${name}</h3>
        <div class="badges" aria-label="Project metadata">
          <span class="badge">${langBadge}</span>
          <span class="badge">${updatedBadge}</span>
          <span class="badge">${starsBadge}</span>
        </div>
      </div>
      <span class="badge">#${absoluteIndex + 1}</span>
    </div>

    <p>${desc}</p>

    <div class="project-actions">
      <a class="btn primary" href="${repoUrl}" target="_blank" rel="noreferrer">${t("project_repo_btn")}</a>
      ${homepage ? `<a class="btn" href="${homepage}" target="_blank" rel="noreferrer">${t("project_demo_btn")}</a>` : ""}
    </div>
  `;
  return card;
}

function renderCarousel() {
  if (!elTrack || !elDots) return;

  elTrack.innerHTML = "";
  elDots.innerHTML = "";

  const pages = chunk(projects, PER_PAGE);
  const totalPages = Math.max(1, pages.length);

  pageIndex = Math.max(0, Math.min(pageIndex, totalPages - 1));

  pages.forEach((page, pIdx) => {
    const pageEl = document.createElement("div");
    pageEl.className = "carousel-page";

    const grid = document.createElement("div");
    grid.className = "projects-grid";

    page.forEach((proj, i) => {
      const abs = pIdx * PER_PAGE + i;
      grid.appendChild(buildProjectCard(proj, abs));
    });

    // if last page has <3, add fillers to keep spacing
    const missing = PER_PAGE - page.length;
    for (let k = 0; k < missing; k++) {
      const filler = document.createElement("div");
      filler.className = "project-card";
      filler.style.opacity = "0";
      filler.style.pointerEvents = "none";
      grid.appendChild(filler);
    }

    pageEl.appendChild(grid);
    elTrack.appendChild(pageEl);

    const dot = document.createElement("button");
    dot.className = "dot-btn";
    dot.type = "button";
    dot.setAttribute("aria-label", `Go to page ${pIdx + 1}`);
    dot.setAttribute("aria-current", pIdx === pageIndex ? "true" : "false");
    dot.addEventListener("click", () => goToPage(pIdx));
    elDots.appendChild(dot);
  });

  updateCarousel();
}

function updateCarousel() {
  const pages = Math.max(1, Math.ceil(projects.length / PER_PAGE));
  pageIndex = Math.max(0, Math.min(pageIndex, pages - 1));

  elTrack.style.transform = `translateX(-${pageIndex * 100}%)`;

  [...elDots.children].forEach((btn, i) => {
    btn.setAttribute("aria-current", i === pageIndex ? "true" : "false");
  });

  elStatus.textContent = t("carousel_status_pages", { current: pageIndex + 1, total: pages, perPage: PER_PAGE });

  elPrev.disabled = pages <= 1;
  elNext.disabled = pages <= 1;
}

function goToPage(i) {
  pageIndex = i;
  updateCarousel();
}

function prevPage() {
  const pages = Math.max(1, Math.ceil(projects.length / PER_PAGE));
  if (pages <= 1) return;
  pageIndex = (pageIndex - 1 + pages) % pages;
  updateCarousel();
}

function nextPage() {
  const pages = Math.max(1, Math.ceil(projects.length / PER_PAGE));
  if (pages <= 1) return;
  pageIndex = (pageIndex + 1) % pages;
  updateCarousel();
}

// ---------- stack inference with always-visible labels ----------
const LABELS = {
  languages: {
    Python: { tone: "blue", icon: "py" },
    SQL: { tone: "gray", icon: "db" },
    Java: { tone: "orange", icon: "java" },
    "C#": { tone: "green", icon: "cs" },
    JavaScript: { tone: "yellow", icon: "js" },
    HTML: { tone: "orange", icon: "html" },
    CSS: { tone: "blue", icon: "css" }
  },
  frameworks: {
    FastAPI: { tone: "green", icon: "bolt" },
    SQLAlchemy: { tone: "yellow", icon: "db" },
    "Node.js": { tone: "green", icon: "node" },
    Express: { tone: "gray", icon: "node" }
  },
  tools: {
    Git: { tone: "red", icon: "git" },
    Docker: { tone: "blue", icon: "box" },
    PostgreSQL: { tone: "gray", icon: "db" },
    MongoDB: { tone: "green", icon: "leaf" },
    Linux: { tone: "yellow", icon: "terminal" },
    VSCode: { tone: "blue", icon: "code" }
  }
};

function iconSvg(kind) {
  const paths = {
    py: "M7 7h6v2H7V7Zm0 4h10v2H7v-2Zm0 4h8v2H7v-2Z",
    js: "M7 7h10v2H7V7Zm0 4h6v2H7v-2Zm0 4h10v2H7v-2Z",
    java: "M8 16h8v2H8v-2Zm1-10h6v2H9V6Zm-1 5h10v2H8v-2Z",
    cs: "M9 8h6v2H9V8Zm-1 4h10v2H8v-2Zm1 4h6v2H9v-2Z",
    db: "M12 3c-4.4 0-8 1.3-8 3v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6c0-1.7-3.6-3-8-3Zm0 2c3.6 0 6 .9 6 1s-2.4 1-6 1-6-.9-6-1 2.4-1 6-1Zm0 14c-3.6 0-6-.9-6-1v-2c1.5.9 3.9 1.4 6 1.4s4.5-.5 6-1.4v2c0 .1-2.4 1-6 1Zm0-4c-3.6 0-6-.9-6-1v-2c1.5.9 3.9 1.4 6 1.4s4.5-.5 6-1.4v2c0 .1-2.4 1-6 1Zm0-4c-3.6 0-6-.9-6-1V8c1.5.9 3.9 1.4 6 1.4s4.5-.5 6-1.4v2c0 .1-2.4 1-6 1Z",
    html: "M7 4h10l-1 16-4 1-4-1L7 4Zm2 4h6v2H9V8Zm0 4h6v2H9v-2Z",
    css: "M7 4h10l-1 16-4 1-4-1L7 4Zm2 4h6v2H9V8Zm1 4h5v2H10v-2Z",
    bolt: "M13 2 3 14h7l-1 8 10-12h-7l1-8Z",
    node: "M12 2l8 4v12l-8 4-8-4V6l8-4Zm0 4.2L6.5 8.9v6.2L12 17.8l5.5-2.7V8.9L12 6.2Z",
    git: "M12 2a3 3 0 0 0-2.12.88L8.7 4.06l1.41 1.41a2 2 0 1 1-1.41 1.41L7.29 5.47 3.88 8.88A3 3 0 0 0 3 11v10a1 1 0 0 0 1 1h10a3 3 0 0 0 2.12-.88l3.41-3.41-1.41-1.41a2 2 0 1 1 1.41-1.41l1.41 1.41 1.18-1.18A3 3 0 0 0 22 12V4a2 2 0 0 0-2-2H12Z",
    box: "M21 8l-9-5-9 5v8l9 5 9-5V8Zm-9 3-7-4 7-4 7 4-7 4Z",
    leaf: "M6 20c8 0 14-6 14-14 0 0-10 0-14 4-3 3-3 8 0 10Z",
    terminal: "M4 6h16v12H4V6Zm2 3 3 3-3 3 1.4 1.4L12.8 12 7.4 6.6 6 9Zm6 6h6v-2h-6v2Z",
    code: "M9 18 3 12l6-6 1.4 1.4L5.8 12l4.6 4.6L9 18Zm6 0-1.4-1.4 4.6-4.6-4.6-4.6L15 6l6 6-6 6Z"
  };
  const d = paths[kind] || paths.db;
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${d}"/></svg>`;
}

function makeBadge(label, tone, iconKind, count) {
  const el = document.createElement("span");
  el.className = "gh-badge";
  el.setAttribute("data-tone", tone || "gray");
  el.innerHTML = `
    <span class="mini-icon">${iconSvg(iconKind || "db")}</span>
    <span>${sanitize(label)}</span>
    <span class="count">${typeof count === "number" ? count : 0}</span>
  `;
  return el;
}

function computeLanguageCountsFromRepos() {
  const counts = new Map();
  for (const repo of projects) {
    const langName = repo.language ? String(repo.language).trim() : "";
    if (!langName) continue;
    counts.set(langName, (counts.get(langName) || 0) + 1);
  }
  return counts;
}

function inferCountsFromText() {
  const fwCounts = new Map();
  const toolCounts = new Map();

  const fwRules = [
    { key: "FastAPI", match: ["fastapi"] },
    { key: "SQLAlchemy", match: ["sqlalchemy"] },
    { key: "Node.js", match: ["node", "nodejs", "node.js"] },
    { key: "Express", match: ["express"] }
  ];

  const toolRules = [
    { key: "Docker", match: ["docker"] },
    { key: "PostgreSQL", match: ["postgres", "postgresql"] },
    { key: "MongoDB", match: ["mongodb", "mongo"] },
    { key: "Linux", match: ["linux"] },
    { key: "Git", match: ["git"] },
    { key: "VSCode", match: ["vscode", "vs code", "visual studio code"] }
  ];

  for (const repo of projects) {
    const parts = [
      repo?.name || "",
      repo?.description || "",
      ...(Array.isArray(repo?.topics) ? repo.topics : [])
    ]
      .join(" ")
      .toLowerCase();

    for (const r of fwRules) {
      if (r.match.some((m) => parts.includes(m))) fwCounts.set(r.key, (fwCounts.get(r.key) || 0) + 1);
    }
    for (const r of toolRules) {
      if (r.match.some((m) => parts.includes(m))) toolCounts.set(r.key, (toolCounts.get(r.key) || 0) + 1);
    }
  }

  return { fwCounts, toolCounts };
}

function renderStack() {
  if (!elStackLangBadges || !elStackFwBadges || !elStackToolBadges) return;

  elStackLangBadges.innerHTML = "";
  elStackFwBadges.innerHTML = "";
  elStackToolBadges.innerHTML = "";

  const langCounts = computeLanguageCountsFromRepos();
  const { fwCounts, toolCounts } = inferCountsFromText();

  // Always render all registered labels, even with zero
  for (const [name, meta] of Object.entries(LABELS.languages)) {
    elStackLangBadges.appendChild(makeBadge(name, meta.tone, meta.icon, langCounts.get(name) || 0));
  }

  for (const [name, meta] of Object.entries(LABELS.frameworks)) {
    elStackFwBadges.appendChild(makeBadge(name, meta.tone, meta.icon, fwCounts.get(name) || 0));
  }

  for (const [name, meta] of Object.entries(LABELS.tools)) {
    elStackToolBadges.appendChild(makeBadge(name, meta.tone, meta.icon, toolCounts.get(name) || 0));
  }
}

// ---------- GitHub fetch ----------
async function loadProjects() {
  const url = `https://api.github.com/users/${GH_USER}/repos?sort=updated&per_page=100`;
  const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  if (!res.ok) throw new Error("GitHub API error");

  const all = await res.json();

  projects = all
    .filter((r) => !r.fork)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, MAX_PROJECTS);

  pageIndex = 0;
  renderCarousel();
  renderStack();
}

// ---------- toast + email copy ----------
function showToastNearCursor(message) {
  if (!elToast) return;

  elToast.textContent = message;
  elToast.style.left = "-9999px";
  elToast.style.top = "-9999px";
  elToast.classList.add("show");

  const rect = elToast.getBoundingClientRect();
  const padding = 12;

  let x = lastMouse.x;
  let y = lastMouse.y - 18;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  x = Math.max(padding, Math.min(x, vw - rect.width - padding));
  y = Math.max(padding, Math.min(y, vh - rect.height - padding));

  elToast.style.left = `${x}px`;
  elToast.style.top = `${y}px`;

  clearTimeout(showToastNearCursor._t);
  showToastNearCursor._t = setTimeout(() => elToast.classList.remove("show"), 1400);
}

async function copyEmail() {
  const email = elEmailText?.textContent?.trim() || "";
  if (!email) return;

  try {
    await navigator.clipboard.writeText(email);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = email;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }

  elCopyEmailBtn.classList.add("copied");
  showToastNearCursor(t("toast_copied"));
  clearTimeout(copyEmail._t);
  copyEmail._t = setTimeout(() => elCopyEmailBtn.classList.remove("copied"), 1200);
}

// ---------- email popover ----------
let popCloseTimer = null;

function openEmailPop() {
  clearTimeout(popCloseTimer);
  elEmailWrap.classList.add("open");
  elEmailBtn.setAttribute("aria-expanded", "true");
}
function closeEmailPopDelayed() {
  clearTimeout(popCloseTimer);
  popCloseTimer = setTimeout(() => {
    elEmailWrap.classList.remove("open");
    elEmailBtn.setAttribute("aria-expanded", "false");
  }, 120);
}
function wireEmailUI() {
  elEmailBtn.addEventListener("mouseenter", openEmailPop);
  elEmailBtn.addEventListener("mouseleave", closeEmailPopDelayed);
  elEmailPop.addEventListener("mouseenter", openEmailPop);
  elEmailPop.addEventListener("mouseleave", closeEmailPopDelayed);

  elEmailBtn.addEventListener("focus", openEmailPop);
  elEmailBtn.addEventListener("blur", closeEmailPopDelayed);

  elEmailBtn.addEventListener("click", () => {
    const isOpen = elEmailWrap.classList.contains("open");
    if (isOpen) {
      elEmailWrap.classList.remove("open");
      elEmailBtn.setAttribute("aria-expanded", "false");
    } else openEmailPop();
  });

  elCopyEmailBtn.addEventListener("click", copyEmail);

  document.addEventListener("click", (e) => {
    if (!elEmailWrap.contains(e.target)) {
      elEmailWrap.classList.remove("open");
      elEmailBtn.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      elEmailWrap.classList.remove("open");
      elEmailBtn.setAttribute("aria-expanded", "false");
    }
  });
}

// ---------- wire UI ----------
function wireUI() {
  elPrev.addEventListener("click", prevPage);
  elNext.addEventListener("click", nextPage);

  elViewport.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") prevPage();
    if (e.key === "ArrowRight") nextPage();
  });

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const fakeBtn = document.getElementById("fakeSendBtn");
  const fakeMsg = document.getElementById("fakeSendMsg");
  if (fakeBtn && fakeMsg) {
    fakeBtn.addEventListener("click", () => {
      fakeMsg.textContent = t("fake_send_msg");
      setTimeout(() => (fakeMsg.textContent = ""), 2500);
    });
  }

  elLangToggle.addEventListener("click", () => {
    setLang(lang === "pt" ? "en" : "pt");
    updateToggleUI();
  });

  wireEmailUI();
  updateToggleUI();
  setLang(lang);
}

wireUI();

loadProjects().catch(() => {
  projects = [
    {
      name: "MechanizedDepths",
      description:
        lang === "en"
          ? "Personal project focused on systems, automation, and data-driven design."
          : "Projeto pessoal com foco em sistemas, automação e design data-driven.",
      language: "JavaScript",
      updated_at: new Date().toISOString(),
      stargazers_count: 0,
      html_url: "https://github.com/lucasmilanezs/MechanizedDepths",
      homepage: "",
      topics: ["kubejs", "minecraft", "data-driven", "event-driven", "docker", "linux"]
    }
  ];
  renderCarousel();
  renderStack();
});