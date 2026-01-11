export async function onRequestGet(context)
{
    const mirrorlist = context.params?.mirrorlist;

    if (!mirrorlist || typeof mirrorlist !== "string")
    {
        return json({ error: "Bad request: Missing mirrorlist" }, 400);
    }

    if (!mirrorlist.endsWith(".json"))
    {
        return json({ error: "Bad request: Expected .json format" }, 400);
    }

    const mirrorlistName = mirrorlist.replace(/\.json$/i, "");
    const regex = /^(\d+)\.(\d+)(\.(\d+))?\.(\w+)(\.(\d+))?(\.mono)?$/;
    const match = mirrorlistName.match(regex);

    if (!match)
    {
        return json({ error: "Bad request: Invalid version format" }, 400);
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

    const mirrorlistResponse = {
        mirrors: [
            {
                name: "Official GitHub Releases mirror",
                url: `https://github.com/Redot-Engine/redot-engine/releases/download/redot-${ downloadPathVersion }/Redot_v${ templateVersion }_export_templates.tpz`,
            },
        ],
    };

    return json(mirrorlistResponse, 200);
}

function json(obj, status = 200)
{
    return new Response(JSON.stringify(obj, null, 2), {
        status,
        headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
        },
    });
}
