import fsp from "fs/promises";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectDir = path.resolve(__dirname, "./");
const distDir = path.resolve(projectDir, "public");


export async function fetchJSON(outputDir, apiUrl, options = {})
{
    if (!outputDir || typeof outputDir !== "string")
    {
        throw new Error("outputDir must be a non-empty string");
    }
    if (!apiUrl || typeof apiUrl !== "string")
    {
        throw new Error("apiUrl must be a non-empty string");
    }

    const filename = options.filename || "someJSONFile.json";
    const timeoutMs = Number.isFinite(options.timeoutMs)
        ? options.timeoutMs
        : 15000;

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    let json;
    try
    {
        const res = await fetch(apiUrl, {
            signal: controller.signal,
            headers: {
                "User-Agent": "RedotEngine/1.0 (+https://redotengine.org)",
                "Accept": "application/vnd.github+json",
            },
        });

        if (!res.ok)
        {
            throw new Error(
                `Failed to fetch GitHub release: ${ res.status } ${ res.statusText }`
            );
        }

        json = await res.json();
    } finally
    {
        clearTimeout(t);
    }

    await fsp.mkdir(outputDir, { recursive: true });

    const payload = {
        source: apiUrl,
        generatedAt: new Date().toISOString(),
        data: json,
    };

    const filePath = path.join(outputDir, filename);
    await fsp.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");

    return { filePath, apiUrl };
}

const apiUrl =
    "https://api.github.com/repos/Redot-Engine/redot-engine/releases/latest";

fetchJSON(path.join(distDir, "data"), apiUrl, {
    filename: "latest-release.json",
})
    .then(({ filePath }) => console.log("Saved:", filePath))
    .catch((err) =>
    {
        console.error(err);
        process.exitCode = 1;
    });