// The packages page of a vex registry. It reads packages.json, which `vex registry json` writes,
// and shows a list with search and a page per package. Everything in packages.json comes from
// package authors, so all of it is escaped, and READMEs are sanitized after Markdown rendering.

const REGISTRY = new URL(".", location.href).href.replace(/\/$/, "");
const view = document.getElementById("view");
const search = document.getElementById("q");
let packages = [];

const escape = (text) =>
  String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const commandBox = (command) =>
  `<div class="cmd"><code>${escape(command)}</code><button class="copy" data-copy="${escape(command)}">Copy</button></div>`;

const findPackage = (name) => packages.find((p) => p.name === name);

function renderReadme(markdown) {
  if (!markdown) return '<p class="muted">This package has no README.</p>';
  if (window.marked && window.DOMPurify) {
    return DOMPurify.sanitize(marked.parse(markdown));
  }
  return `<pre>${escape(markdown)}</pre>`;
}

function card(pkg) {
  const tags = [];
  for (const lib of pkg.links) tags.push(`<span class="tag c" title="Links the C library lib${escape(lib)}">C: ${escape(lib)}</span>`);
  const deps = Object.keys(pkg.versions[0].dependencies);
  if (deps.length) tags.push(`<span class="tag">${deps.length} ${deps.length === 1 ? "dependency" : "dependencies"}</span>`);
  if (pkg.used_by.length) tags.push(`<span class="tag">used by ${pkg.used_by.length}</span>`);
  tags.push(`<span class="tag">${pkg.versions.length} ${pkg.versions.length === 1 ? "version" : "versions"}</span>`);
  return `<a class="card" href="#/${encodeURIComponent(pkg.name)}">
    <div class="card-top"><span class="card-name">${escape(pkg.name)}</span><span class="ver">${escape(pkg.latest)}</span></div>
    <p>${escape(pkg.description || "No description.")}</p>
    <div class="tags">${tags.join("")}</div>
  </a>`;
}

function showHome(query) {
  const wanted = query.trim().toLowerCase();
  const shown = packages.filter(
    (p) => !wanted || p.name.toLowerCase().includes(wanted) || (p.description || "").toLowerCase().includes(wanted),
  );
  const intro = wanted
    ? ""
    : `<section class="hero">
        <h1>Packages for Vx</h1>
        <p>Libraries you can add to a Vx program with <code>vex</code>. Versions are picked the way Go modules pick them, so a new release never changes your build until you ask for it.</p>
        <div class="setup">
          <div class="step"><b>1. Point vex at this registry</b>${commandBox(`export VEX_REGISTRY=${REGISTRY}`)}</div>
          <div class="step"><b>2. Add a package and build</b>${commandBox("vex add intmath && vex run")}</div>
        </div>
      </section>`;
  const list = shown.length
    ? `<div class="grid">${shown.map(card).join("")}</div>`
    : `<p class="empty">No package matches “${escape(query)}”.</p>`;
  view.innerHTML = `${intro}
    <div class="list-head"><h2>${wanted ? "Results" : "All packages"}</h2><span class="muted">${shown.length} of ${packages.length}</span></div>
    ${list}`;
  document.title = "Vx packages";
}

function showPackage(name) {
  const pkg = findPackage(name);
  if (!pkg) {
    view.innerHTML = `<p class="crumb"><a href="#/">All packages</a></p><p class="empty">There is no package called <code>${escape(name)}</code>.</p>`;
    return;
  }
  const latest = pkg.versions[0];
  const dependencies = Object.entries(latest.dependencies);
  const link = (n) => (findPackage(n) ? `<a href="#/${encodeURIComponent(n)}">${escape(n)}</a>` : escape(n));

  const versions = pkg.versions
    .map(
      (v, i) => `<li>
        <div class="row"><code>${escape(v.version)}</code>${i === 0 ? '<span class="latest">latest</span>' : ""}
          <a href="${REGISTRY}/archives/${encodeURIComponent(pkg.name)}/${encodeURIComponent(pkg.name)}-${encodeURIComponent(v.version)}.tar.gz">.tar.gz</a></div>
        <span class="sha" title="SHA-256 of the archive">sha256 ${escape(v.sha256.slice(0, 16))}…</span>
      </li>`,
    )
    .join("");

  const boxes = [
    `<div class="box"><h3>Install</h3>${commandBox(`vex add ${pkg.name}`)}
      <p class="note">Adds <code>${escape(pkg.name)} = "${escape(pkg.latest)}"</code> to your <code>vex.toml</code>.</p></div>`,
    `<div class="box"><h3>Import</h3><ul>${pkg.modules.map((m) => `<li><code>import ${escape(pkg.name)}::${escape(m)};</code></li>`).join("")}</ul></div>`,
  ];
  if (pkg.links.length) {
    boxes.push(`<div class="box"><h3>Links C libraries</h3><ul>${pkg.links.map((l) => `<li><code>lib${escape(l)}</code></li>`).join("")}</ul>
      <p class="note">Linked into every program that uses this package. Your vxc needs <code>-l</code>.</p></div>`);
  }
  boxes.push(`<div class="box"><h3>Dependencies</h3>${
    dependencies.length
      ? `<ul>${dependencies.map(([n, v]) => `<li>${link(n)}<code class="ver">${escape(v)} or later</code></li>`).join("")}</ul>`
      : '<p class="note">None.</p>'
  }</div>`);
  if (pkg.used_by.length) {
    boxes.push(`<div class="box"><h3>Used by</h3><ul>${pkg.used_by.map((n) => `<li>${link(n)}</li>`).join("")}</ul></div>`);
  }
  boxes.push(`<div class="box versions"><h3>Versions</h3><ul>${versions}</ul></div>`);

  view.innerHTML = `
    <p class="crumb"><a href="#/">All packages</a></p>
    <div class="pkg-head"><h1>${escape(pkg.name)}</h1><span class="ver">${escape(pkg.latest)}</span></div>
    <p class="pkg-desc">${escape(pkg.description || "")}</p>
    <div class="pkg">
      <article class="readme">${renderReadme(pkg.readme)}</article>
      <aside class="side">${boxes.join("")}</aside>
    </div>`;
  document.title = `${pkg.name} · Vx packages`;
  window.scrollTo(0, 0);
}

function route() {
  const match = location.hash.match(/^#\/(.+)$/);
  if (match) {
    showPackage(decodeURIComponent(match[1]));
  } else {
    showHome(search.value);
  }
}

search.addEventListener("input", () => {
  if (location.hash && location.hash !== "#/") {
    history.replaceState(null, "", "#/");
  }
  showHome(search.value);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement !== search) {
    event.preventDefault();
    search.focus();
  }
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest(".copy");
  if (!button) return;
  try {
    await navigator.clipboard.writeText(button.dataset.copy);
    button.textContent = "Copied";
    button.classList.add("done");
  } catch (error) {
    button.textContent = "Select and copy";
    console.error("copy failed", error);
  }
  setTimeout(() => {
    button.textContent = "Copy";
    button.classList.remove("done");
  }, 1500);
});

window.addEventListener("hashchange", route);

fetch(`${REGISTRY}/packages.json`, { cache: "no-cache" })
  .then((response) => {
    if (!response.ok) throw new Error(`packages.json: HTTP ${response.status}`);
    return response.json();
  })
  .then((file) => {
    packages = file.packages;
    route();
  })
  .catch((error) => {
    view.innerHTML = `<p class="empty">Cannot load the package list: ${escape(error.message)}</p>`;
  });
