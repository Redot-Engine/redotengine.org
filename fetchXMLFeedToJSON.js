import fsp from "fs/promises";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { xml2js } from "xml-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectDir = path.resolve(__dirname, "./");
const distDir = path.resolve(projectDir, "public");





export async function fetchXMLFeedToJSON(outputDir, feedUrl, options = {})
{
    if (!outputDir || typeof outputDir !== "string")
    {
        throw new Error("outputDir must be a non-empty string");
    }
    if (!feedUrl || typeof feedUrl !== "string")
    {
        throw new Error("feedUrl must be a non-empty string");
    }

    const filename = options.filename || "xmlfeed.json";
    const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 15000;

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    let xmlText;
    try
    {
        const res = await fetch(feedUrl, {
            signal: controller.signal,
            headers: { "User-Agent": "RedotEngine/1.0 (+https://redotengine.org)" },
        });
        if (!res.ok)
        {
            throw new Error(`Failed to fetch feed: ${ res.status } ${ res.statusText }`);
        }
        xmlText = await res.text();
    }
    finally
    {
        clearTimeout(t);
    }

    const jsonObj = xml2js(xmlText, {
        compact: true,
        ignoreDeclaration: true,
        ignoreInstruction: true,
        ignoreComment: true,
        ignoreCdata: false,
        ignoreDoctype: true,
        trim: true,
        nativeType: false,
    });

    await fsp.mkdir(outputDir, { recursive: true });

    const payload = {
        source: feedUrl,
        generatedAt: new Date().toISOString(),
        data: jsonObj,
    };

    const filePath = path.join(outputDir, filename);
    await fsp.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");

    return { filePath, feedUrl };
}


const feedUrl = "https://blog.redotengine.org/feeds/posts/default?alt=rss&max-results=4";

fetchXMLFeedToJSON(path.join(distDir, "data"), feedUrl, {
    filename: "blogger-feed.json",
})
    .then(({ filePath }) => console.log("Saved:", filePath))
    .catch((err) =>
    {
        console.error(err);
        process.exitCode = 1;
    });
