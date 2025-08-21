import axios from "axios";
import * as cheerio from "cheerio";
const BASE = "https://animesalt.cc";
const AJAX = `${BASE}/wp-admin/admin-ajax.php`;
function createHttpClient() {
    const instance = axios.create({
        withCredentials: true,
        headers: {
            "User-Agent": "Mozilla/5.0",
            Referer: BASE,
            Origin: BASE,
            "X-Requested-With": "XMLHttpRequest",
        },
        timeout: 20000,
    });
    return instance;
}
const http = createHttpClient();
export function extractNonceFromHtml(html) {
    const m = html.match(/"nonce"\s*:\s*"([a-f0-9]+)"/i);
    return m ? m[1] : null;
}
export function extractPostIdFromHtml(html) {
    const patterns = [
        /postid-(\d+)/i,
        /"post"\s*:\s*"?(\d+)"?/i,
        /data-post(?:-id)?\s*=\s*"?(\d+)"?/i,
        /post_id\s*=\s*"?(\d+)"?/i,
        /var\s+post(?:Id|_id)\s*=\s*(\d+)/i,
    ];
    for (const re of patterns) {
        const m = html.match(re);
        if (m && m[1]) {
            const n = Number(m[1]);
            if (Number.isFinite(n))
                return n;
        }
    }
    return null;
}
export function parseEpisodesFromHtml(html) {
    const $ = cheerio.load(html);
    const episodes = [];
    $("article.post.episodes").each((_, el) => {
        const link = $(el).find('a[href*="/episode"]').first();
        const href = link.attr("href");
        const titleEl = $(el).find("h2.entry-title").first();
        const titleText = titleEl.text().trim() || (link.text().trim() || null);
        const numberText = $(el).find(".num-epi").first().text().trim() || null;
        if (href) {
            episodes.push({
                number: numberText,
                title: titleText || null,
                url: new URL(href, BASE).toString(),
            });
        }
    });
    if (episodes.length === 0) {
        $('a[href*="/episode"]').each((_, a) => {
            const href = $(a).attr("href");
            if (!href)
                return;
            const title = $(a).text().trim() || null;
            episodes.push({ title, url: new URL(href, BASE).toString() });
        });
    }
    return episodes;
}
export function parseSeasonsFromHtml(html) {
    const $ = cheerio.load(html);
    const seasons = [];
    $("a.season-btn").each((_, a) => {
        const seasonRaw = $(a).attr("data-season");
        const label = $(a).text().trim();
        const classes = ($(a).attr("class") || "").split(/\s+/);
        const isNonRegional = classes.includes("non-regional");
        if (seasonRaw) {
            const maybeNum = Number(seasonRaw);
            seasons.push({
                season: Number.isFinite(maybeNum) ? maybeNum : seasonRaw,
                label,
                nonRegional: isNonRegional,
            });
        }
    });
    return seasons;
}
export function parsePosterFromHtml(html, baseUrl) {
    const $ = cheerio.load(html);
    let img = null;
    const og = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
    if (og)
        img = og;
    if (!img) {
        const cover = $(".cover img, .poster img, .entry-thumb img").first();
        const src = cover.attr("src") || cover.attr("data-src") || cover.attr("data-original");
        if (src)
            img = src;
    }
    if (img) {
        try {
            img = new URL(img, baseUrl).toString();
        }
        catch { }
    }
    return img;
}
export function parseAnimeListFromHtml(html) {
    const $ = cheerio.load(html);
    const items = [];
    const seen = new Set();
    $("article.post").each((_, el) => {
        // Prefer series links if present within the article
        let href = $(el)
            .find('a[href*="/series/"]')
            .first()
            .attr("href");
        if (!href) {
            const candidate = $(el).find("a").first().attr("href");
            href = candidate || undefined;
        }
        if (!href)
            return;
        const abs = new URL(href, BASE).toString();
        if (seen.has(abs))
            return;
        seen.add(abs);
        const title = $(el).find("h2.entry-title").first().text().trim() || $(el).find("a").first().text().trim() || null;
        // Attempt to extract post id from this article
        let postId = undefined;
        const idAttr = $(el).attr("id") || ""; // often like post-12345
        const classAttr = $(el).attr("class") || ""; // may include post-12345
        const idMatch = idAttr.match(/post-(\d+)/) || classAttr.match(/post-(\d+)/);
        if (idMatch && idMatch[1]) {
            const n = Number(idMatch[1]);
            if (Number.isFinite(n))
                postId = n;
        }
        // Try multiple strategies to find a thumbnail
        let img = null;
        // 1) Any <img> in the article
        const imgEl = $(el).find("img").first();
        if (imgEl && imgEl.length) {
            img =
                imgEl.attr("data-src") ||
                    imgEl.attr("data-lazy-src") ||
                    imgEl.attr("data-img") ||
                    imgEl.attr("data-original") ||
                    imgEl.attr("data-thumb") ||
                    imgEl.attr("data-thumbnail") ||
                    imgEl.attr("src") ||
                    null;
            if (img && /^data:/i.test(img)) {
                img = null;
            }
            if (!img) {
                const srcset = imgEl.attr("srcset") || imgEl.attr("data-srcset") || imgEl.attr("data-lazy-srcset") || "";
                const candidates = srcset
                    .split(",")
                    .map(s => s.trim().split(" ")[0])
                    .filter(Boolean)
                    .filter(u => !/^data:/i.test(u));
                // Prefer the last (usually largest) source if present, else first
                const pick = candidates[candidates.length - 1] || candidates[0];
                if (pick)
                    img = pick;
            }
            // 1b) As a last resort, scan all attributes for a URL-looking value
            if (!img) {
                const attribs = imgEl.get(0)?.attribs || {};
                const urlCandidates = Object.values(attribs)
                    .map(v => (v || "").toString())
                    .flatMap(v => v.match(/https?:[^\s'"()]+/g) || [])
                    .filter(u => !/^data:/i.test(u));
                // Prefer image-like extensions
                const scored = urlCandidates
                    .map(u => ({ u, s: /(\.avif|\.webp|\.jpeg|\.jpg|\.png)(\?|$)/i.test(u) ? 2 : 1 }))
                    .sort((a, b) => b.s - a.s);
                if (scored.length)
                    img = scored[0].u;
            }
        }
        // 2) background-image in inline styles
        if (!img) {
            const styleEl = $(el).find('[style*="background-image"]').first();
            const style = styleEl.attr("style") || "";
            const m = style.match(/background-image\s*:\s*url\((['\"]?)([^)\'\"]+)\1\)/i);
            if (m && m[2])
                img = m[2];
        }
        // 3) data attributes commonly used by lazy loaders on wrappers
        if (!img) {
            const wrap = $(el).find('[data-bg], [data-background], [data-cover]').first();
            img = wrap.attr("data-bg") || wrap.attr("data-background") || wrap.attr("data-cover") || null;
        }
        if (img) {
            try {
                img = new URL(img, abs).toString();
            }
            catch { }
        }
        items.push({ title, url: abs, image: img || undefined, postId });
    });
    if (items.length === 0) {
        $('a[href*="/series/"]').each((_, a) => {
            const href = $(a).attr("href");
            if (!href)
                return;
            const abs = new URL(href, BASE).toString();
            if (seen.has(abs))
                return;
            seen.add(abs);
            const title = $(a).text().trim() || null;
            items.push({ title, url: abs });
        });
    }
    return items;
}
export async function fetchAnimeList(page) {
    const payload = new URLSearchParams({
        action: "torofilm_infinite_scroll",
        page: String(page),
        per_page: "12",
        query_type: "archive",
        post_type: "series",
    });
    let items = [];
    try {
        const { data } = await http.post(AJAX, payload, { responseType: "text" });
        // If response contains HTML to render, parse it; otherwise, try to detect known shapes
        let html;
        if (typeof data === "object" && data) {
            // Some themes return { success, data: '<html>' }
            const anyData = data;
            if (typeof anyData.html === "string")
                html = anyData.html;
            else if (typeof anyData.data === "string")
                html = anyData.data;
            else if (typeof anyData.content === "string")
                html = anyData.content;
        }
        else if (typeof data === "string") {
            html = data;
            // Occasionally JSON string wrapped; attempt parse
            try {
                const parsed = JSON.parse(data);
                if (parsed && typeof parsed === "object") {
                    if (typeof parsed.html === "string")
                        html = parsed.html;
                    else if (typeof parsed.data === "string")
                        html = parsed.data;
                    else if (typeof parsed.content === "string")
                        html = parsed.content;
                }
            }
            catch {
                // keep html as-is
            }
        }
        if (html)
            items = parseAnimeListFromHtml(html);
    }
    catch {
        // ignore and try fallbacks
    }
    if (items.length === 0) {
        // Fallback: try series archive pages
        const candidates = [];
        if (page <= 1) {
            candidates.push(`${BASE}/series/`);
            candidates.push(`${BASE}/`);
        }
        candidates.push(`${BASE}/series/page/${page}/`);
        candidates.push(`${BASE}/series/?_page=${page}`);
        candidates.push(`${BASE}/?post_type=series&_page=${page}`);
        for (const url of candidates) {
            try {
                const resp = await http.get(url, { responseType: "text" });
                const html = String(resp.data || "");
                const parsed = parseAnimeListFromHtml(html);
                if (parsed.length > 0) {
                    items = parsed;
                    break;
                }
            }
            catch {
                // continue
            }
        }
    }
    return { page, items };
}
export async function fetchAnimeDetails(params) {
    const { url, postId, season } = params;
    const pageResp = await http.get(url);
    const html = pageResp.data;
    const nonce = extractNonceFromHtml(html);
    const seasons = parseSeasonsFromHtml(html);
    const poster = parsePosterFromHtml(html, url);
    const resolvedPostId = Number.isFinite(postId) && postId > 0 ? postId : (extractPostIdFromHtml(html) ?? 0);
    let episodes = [];
    if (typeof season === "number" && Number.isFinite(season)) {
        const payload = new URLSearchParams({ action: "action_select_season", season: String(season), post: String(resolvedPostId) });
        const resp = await http.post(AJAX, payload, { headers: { Referer: url } });
        const text = typeof resp.data === "string" ? resp.data : JSON.stringify(resp.data);
        episodes = parseEpisodesFromHtml(text);
    }
    else {
        // Only try AJAX episodes if we have a valid postId
        if (Number.isFinite(resolvedPostId) && resolvedPostId > 0) {
            const payload = new URLSearchParams({ action: "torofilm_get_episodes", id: String(resolvedPostId), nonce: nonce || "" });
            const resp = await http.post(AJAX, payload, { headers: { Referer: url } });
            const body = resp.data;
            if (typeof body === "string") {
                const trimmed = body.trim();
                if (trimmed !== "" && trimmed !== "0") {
                    try {
                        const parsed = JSON.parse(body);
                        if (parsed && typeof parsed === "object" && "html" in parsed) {
                            episodes = parseEpisodesFromHtml(parsed.html);
                        }
                    }
                    catch {
                        episodes = parseEpisodesFromHtml(body);
                    }
                }
            }
            else if (typeof body === "object" && body && "html" in body) {
                episodes = parseEpisodesFromHtml(body.html);
            }
        }
    }
    if (episodes.length === 0) {
        episodes = parseEpisodesFromHtml(html);
    }
    return { url, postId: resolvedPostId, season: season ?? null, seasons, episodes, poster };
}
export async function fetchEpisodePlayers(episodeUrl) {
    const resp = await http.get(episodeUrl, { responseType: "text" });
    const html = String(resp.data || "");
    const $ = cheerio.load(html);
    const sources = [];
    // Common embed iframes
    $("iframe").each((_, el) => {
        const src = $(el).attr("data-src") || $(el).attr("src");
        if (!src)
            return;
        const abs = new URL(src, episodeUrl).toString();
        sources.push({ src: abs, kind: "iframe" });
    });
    // Video sources on page, if any
    $("video source").each((_, el) => {
        const src = $(el).attr("src");
        if (!src)
            return;
        const abs = new URL(src, episodeUrl).toString();
        const label = $(el).attr("label") || $(el).attr("data-label") || null;
        const quality = $(el).attr("res") || $(el).attr("data-res") || null;
        sources.push({ src: abs, label, quality, kind: "video" });
    });
    // Fallback: look for JSON or inline config with m3u8
    const m3u8Match = html.match(/https?:[^"'\s]+\.m3u8/);
    if (m3u8Match) {
        try {
            const abs = new URL(m3u8Match[0], episodeUrl).toString();
            sources.push({ src: abs, kind: "video", label: "HLS" });
        }
        catch { }
    }
    // Deduplicate by src
    const seen = new Set();
    const dedup = sources.filter((s) => (seen.has(s.src) ? false : (seen.add(s.src), true)));
    return dedup;
}
