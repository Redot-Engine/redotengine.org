export default {
    async fetch(request, env, ctx)
    {
        const url = new URL(request.url);

        if (url.pathname.startsWith("/api/mirrorlists/"))
        {
            const canCache = request.method === "GET";
            const cache = caches.default;

            if (canCache)
            {
                const cached = await cache.match(request);
                if (cached) return cached;
            }

            const mirrorlist = url.pathname.slice("/api/mirrorlists/".length);
            const res = handleMirrorlist(mirrorlist);

            const headers = new Headers({
                "content-type": "application/json; charset=utf-8",
            });

            if (res.status === 200)
            {
                headers.set("cache-control", "public, max-age=3600");
            }
            else
            {
                headers.set("cache-control", "no-store");
            }

            const response = new Response(JSON.stringify(res.body, null, 2), {
                status: res.status,
                headers,
            });

            if (canCache && res.status === 200)
            {
                ctx.waitUntil(cache.put(request, response.clone()));
            }

            return response;
        }

        return env.ASSETS.fetch(request);
    },
};

function handleMirrorlist(mirrorlist)
{
    if (!mirrorlist || !mirrorlist.endsWith(".json"))
    {
        return { status: 400, body: { error: "Bad request: Expected .json format" } };
    }

    const mirrorlistName = mirrorlist.replace(/\.json$/i, "");

    const regex = /^(\d+)\.(\d+)(\.(\d+))?\.(\w+)(\.(\d+))?(\.mono)?$/;
    const match = mirrorlistName.match(regex);

    if (!match)
    {
        return { status: 400, body: { error: "Bad request: Invalid version format" } };
    }

    const major = match[1];
    const minor = match[2];
    const patch = match[4] || "0";
    const status = match[5];
    const statusVersion = match[7] ? `.${ match[7] }` : "";
    const monoTag = match[8] ? "_mono" : "";

    const patchPart = patch !== "0" ? `.${ patch }` : "";
    const downloadPathVersion = `${ major }.${ minor }${ patchPart }-${ status }${ statusVersion }`;
    const templateVersion = `${ major }.${ minor }${ patchPart }-${ status }${ statusVersion }${ monoTag }`;

    return {
        status: 200,
        body: {
            mirrors: [
                {
                    name: "Official GitHub Releases mirror",
                    url: `https://github.com/Redot-Engine/redot-engine/releases/download/redot-${ downloadPathVersion }/Redot_v${ templateVersion }_export_templates.tpz`,
                },
            ],
        },
    };
}
