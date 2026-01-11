async function loadLatestReleaseDownloads()
{
    const jsonPath = "/data/latest-release.json";

    const res = await fetch(jsonPath, { cache: "no-store" });
    if (!res.ok)
        throw new Error(`Failed to load ${ jsonPath }: ${ res.status }`);

    const payload = await res.json();
    const release = payload.data;

    const titleEl = document.getElementById("release-title");
    const metaEl = document.getElementById("release-meta");

    const releaseName = `Latest Release - ${ release.name || release.tag_name
        }`;
    const published = release.published_at
        ? new Date(release.published_at).toLocaleDateString()
        : "";

    titleEl.textContent = releaseName;
    metaEl.innerHTML = `
    <a href="${ release.html_url
        }" target="_blank" rel="noopener">View release notes</a>
    ${ published ? ` · Published: ${ published }` : "" }
  `;
    const ul = document.getElementById("release-assets");
    ul.innerHTML = "";

    const assets = Array.isArray(release.assets) ? release.assets : [];

    assets.sort((a, b) => (b.size || 0) - (a.size || 0));

    for (const asset of assets)
    {
        const li = document.createElement("li");
        li.className = "release-asset";

        const sizeMB = Number.isFinite(asset.size)
            ? (asset.size / 1024 / 1024).toFixed(1) + " MB"
            : "";

        li.innerHTML = `
      <a class="asset-link" href="${ asset.browser_download_url }" target="_blank" rel="noopener">
        ${ asset.name }
      </a> - 
      <span class="asset-size">${ sizeMB }</span>
    `;

        ul.appendChild(li);
    }

    if (assets.length === 0)
    {
        ul.innerHTML = `<li class="release-empty">No downloadable files found.</li>`;
    }
}

document.addEventListener("DOMContentLoaded", () =>
{
    loadLatestReleaseDownloads().catch((err) =>
    {
        console.error(err);
        const root = document.getElementById("release-downloads");
        if (root) root.innerHTML = `<p class="release-error">Failed to load downloads.</p>`;
    });
});