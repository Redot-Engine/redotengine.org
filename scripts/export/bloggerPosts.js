(function ()
{
    const FEED_JSON_URL = "/data/blogger-feed.json";
    const TARGET_ID = "latest-blog-list";

    function decodeHtmlEntities(str)
    {
        if (!str) return "";
        const textarea = document.createElement("textarea");
        textarea.innerHTML = str;
        return textarea.value;
    }

    function stripHtml(html)
    {
        if (!html) return "";
        return String(html)
            .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function toSnippet(html, maxLen = 180)
    {
        const text = stripHtml(html);
        if (text.length <= maxLen) return text;
        return text.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
    }

    function formatDate(pubDateText)
    {
        // pubDate looks like: "Wed, 03 Dec 2025 07:08:28 +0000"
        const d = new Date(pubDateText);
        if (Number.isNaN(d.getTime())) return pubDateText || "";
        return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
    }

    function getText(node)
    {
        // xml-js compact form uses {_text: "..."}
        if (!node) return "";
        if (typeof node === "string") return node;
        if (typeof node === "object" && typeof node._text === "string") return node._text;
        return "";
    }

    function getThumbnailUrl(item)
    {
        // some posts have media:thumbnail._attributes.url
        const t = item && item["media:thumbnail"];
        const url = t && t._attributes && t._attributes.url;
        if (typeof url === "string") return url;

        // fallback: try first <img src="..."> inside description HTML
        const desc = getText(item.description);
        const m = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
        return m ? m[1] : "";
    }

    function escapeHtml(s)
    {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function buildPostHtml(item, index)
    {
        const title = getText(item.title);
        const url = getText(item.link);
        const pubDate = getText(item.pubDate);
        const descHtml = getText(item.description);

        const thumb = getThumbnailUrl(item);
        const snippet = toSnippet(decodeHtmlEntities(descHtml), 200);

        // first post gets a class so you can make it full-width later
        const isFeatured = index === 0;

        return `
      <article
        id="blog-post-${ index }"
        class="blog-post ${ isFeatured ? "blog-post-featured" : "blog-post-compact" }"
        data-index="${ index }"
      >
        ${ thumb ? `<div class="blog-post-thumb"><img class="blog-post-img" src="${ escapeHtml(thumb) }" alt="${ escapeHtml(title) }"></div>` : "" }
        <div class="blog-post-body">
          <h3 class="blog-post-title">
            <a class="blog-post-link" href="${ escapeHtml(url) }" rel="noopener">${ escapeHtml(title) }</a>
          </h3>
          <div class="blog-post-meta">
            <span class="blog-post-date">${ escapeHtml(formatDate(pubDate)) }</span>
          </div>
          <p class="blog-post-snippet">${ escapeHtml(snippet) }</p>
        </div>
      </article>
    `;
    }

    async function renderLatestBlog()
    {
        const target = document.getElementById(TARGET_ID);
        if (!target) return;

        let json;
        try
        {
            const res = await fetch(FEED_JSON_URL, { cache: "no-store" });
            if (!res.ok) throw new Error(`Failed to load ${ FEED_JSON_URL }: ${ res.status }`);
            json = await res.json();
        } catch (e)
        {
            target.innerHTML = `<div class="blog-error">Failed to load latest blog posts.</div>`;
            console.error(e);
            return;
        }

        const items = json?.data?.rss?.channel?.item;
        const posts = Array.isArray(items) ? items : (items ? [items] : []);

        if (!posts.length)
        {
            target.innerHTML = `<div class="blog-empty">No posts found.</div>`;
            return;
        }

        const html = `${ posts.map(buildPostHtml).join("") }`;

        target.innerHTML = html;
    }

    if (document.readyState === "loading")
    {
        document.addEventListener("DOMContentLoaded", renderLatestBlog);
    } else
    {
        renderLatestBlog();
    }
})();