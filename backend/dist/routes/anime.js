import { Router } from "express";
import { fetchAnimeDetails, fetchAnimeList, fetchEpisodePlayers, parseAnimeListFromHtml } from "../scraper";
export const animeRouter = Router();
animeRouter.get("/anime_list", async (req, res) => {
    try {
        const page = Number(req.query.page ?? 1);
        const data = await fetchAnimeList(Number.isFinite(page) ? page : 1);
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: true, message: err?.message || "Failed to fetch anime list" });
    }
});
animeRouter.get("/anime_details", async (req, res) => {
    try {
        const url = String(req.query.url || "");
        const postId = req.query.post_id !== undefined ? Number(req.query.post_id) : NaN;
        const seasonParam = req.query.season;
        const season = seasonParam !== undefined ? Number(seasonParam) : undefined;
        if (!url) {
            res.status(400).json({ error: true, message: "Missing url" });
            return;
        }
        const data = await fetchAnimeDetails({ url, postId: Number.isFinite(postId) ? postId : 0, season: Number.isFinite(season) ? season : undefined });
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: true, message: err?.message || "Failed to fetch anime details" });
    }
});
animeRouter.get("/search", async (req, res) => {
    try {
        const q = String(req.query.q || "").trim();
        if (!q) {
            res.status(400).json({ error: true, message: "Missing q" });
            return;
        }
        // Reuse list parser against WordPress search results
        const axios = (await import("axios")).default;
        const { data: html } = await axios.get(`https://animesalt.cc/?s=${encodeURIComponent(q)}`, {
            headers: { "User-Agent": "Mozilla/5.0" },
            timeout: 20000,
        });
        const items = parseAnimeListFromHtml(String(html));
        res.json({ q, items });
    }
    catch (err) {
        res.status(500).json({ error: true, message: err?.message || "Failed to search" });
    }
});
animeRouter.get("/episode_players", async (req, res) => {
    try {
        const url = String(req.query.url || "");
        if (!url) {
            res.status(400).json({ error: true, message: "Missing url" });
            return;
        }
        const items = await fetchEpisodePlayers(url);
        res.json({ url, items });
    }
    catch (err) {
        res.status(500).json({ error: true, message: err?.message || "Failed to fetch players" });
    }
});
// Simple image proxy to avoid hotlink protection
animeRouter.get("/image", async (req, res) => {
    try {
        const src = String(req.query.src || "");
        if (!src) {
            res.status(400).json({ error: true, message: "Missing src" });
            return;
        }
        // If data URI, return directly
        if (/^data:/i.test(src)) {
            const match = src.match(/^data:([^;]+);base64,(.*)$/i);
            if (match) {
                const mime = match[1] || "image/png";
                const b64 = match[2] || "";
                res.setHeader("Content-Type", mime);
                res.setHeader("Cache-Control", "public, max-age=86400");
                res.send(Buffer.from(b64, "base64"));
                return;
            }
            res.redirect(302, src);
            return;
        }
        if (!/^https?:\/\//i.test(src)) {
            res.status(400).json({ error: true, message: "Invalid src" });
            return;
        }
        const origin = "https://animesalt.cc"; // pretend request originates from site
        const axios = (await import("axios")).default;
        const resp = await axios.get(src, {
            responseType: "arraybuffer",
            headers: {
                "User-Agent": "Mozilla/5.0",
                Referer: origin + "/",
                Origin: origin,
                Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
            },
            timeout: 20000,
        });
        const ct = resp.headers["content-type"] || "image/jpeg";
        res.setHeader("Content-Type", Array.isArray(ct) ? ct[0] : ct);
        res.setHeader("Cache-Control", "public, max-age=86400");
        res.send(Buffer.from(resp.data));
    }
    catch (err) {
        // Fallback: redirect to original URL to allow browser to attempt direct fetch (may be blocked by hotlink protection)
        try {
            const src = String(req.query.src || "");
            if (src) {
                res.redirect(302, src);
                return;
            }
        }
        catch { }
        res.status(502).json({ error: true, message: err?.message || "Image proxy failed" });
    }
});
// Serve logo from backend folder
animeRouter.get("/logo", async (_req, res) => {
    try {
        const fs = await import("fs/promises");
        const path = await import("path");
        const candidates = [
            path.resolve(process.cwd(), "logo.png"),
            path.resolve(process.cwd(), "../backend/logo.png"),
            path.resolve(process.cwd(), "../../backend/logo.png"),
        ];
        let found = null;
        for (const p of candidates) {
            try {
                const st = await fs.stat(p);
                if (st.isFile()) {
                    found = p;
                    break;
                }
            }
            catch { }
        }
        if (!found) {
            res.status(404).json({ error: true, message: "logo not found" });
            return;
        }
        const data = await fs.readFile(found);
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "public, max-age=604800");
        res.send(Buffer.from(data));
    }
    catch (err) {
        res.status(500).json({ error: true, message: err?.message || "Failed to load logo" });
    }
});
