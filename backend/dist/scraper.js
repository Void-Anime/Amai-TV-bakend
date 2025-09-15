"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractNonceFromHtml = extractNonceFromHtml;
exports.extractPostIdFromHtml = extractPostIdFromHtml;
exports.parseEpisodesFromHtml = parseEpisodesFromHtml;
exports.parseSeasonsFromHtml = parseSeasonsFromHtml;
exports.parseAnimeListFromHtml = parseAnimeListFromHtml;
exports.fetchAnimeList = fetchAnimeList;
exports.parsePosterFromHtml = parsePosterFromHtml;
exports.fetchAnimeDetails = fetchAnimeDetails;
exports.fetchEpisodePlayers = fetchEpisodePlayers;
exports.enrichSeriesPosters = enrichSeriesPosters;
exports.fetchMoviesList = fetchMoviesList;
exports.fetchMovieDetails = fetchMovieDetails;
exports.fetchCartoonList = fetchCartoonList;
exports.fetchNetworkContent = fetchNetworkContent;
exports.fetchOngoingSeries = fetchOngoingSeries;
exports.fetchUpcomingEpisodes = fetchUpcomingEpisodes;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const BASE = 'https://animesalt.cc';
const AJAX = `${BASE}/wp-admin/admin-ajax.php`;
function createHttpClient() {
    const instance = axios_1.default.create({
        withCredentials: true,
        headers: {
            'User-Agent': 'Mozilla/5.0',
            Referer: BASE,
            Origin: BASE,
            'X-Requested-With': 'XMLHttpRequest',
        },
        timeout: 20000,
    });
    return instance;
}
const http = createHttpClient();
function extractNonceFromHtml(html) {
    const m = html.match(/"nonce"\s*:\s*"([a-f0-9]+)"/i);
    return m ? m[1] : null;
}
function extractPostIdFromHtml(html) {
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
function parseEpisodesFromHtml(html) {
    const $ = cheerio.load(html);
    const episodes = [];
    console.log(`parseEpisodesFromHtml: HTML length: ${html.length}`);
    console.log(`parseEpisodesFromHtml: Found ${$('article.post.episodes').length} article.post.episodes elements`);
    console.log(`parseEpisodesFromHtml: Found ${$('a[href*="/episode"]').length} episode links`);
    $('article.post.episodes').each((_, el) => {
        const link = $(el).find('a[href*="/episode"]').first();
        const href = link.attr('href');
        const titleEl = $(el).find('h2.entry-title').first();
        const titleText = titleEl.text().trim() || link.text().trim() || null;
        const numberText = $(el).find('.num-epi').first().text().trim() || null;
        let epPoster = null;
        const imgEl = $(el).find('img').first();
        if (imgEl && imgEl.length) {
            epPoster = imgEl.attr('src') || imgEl.attr('data-src') || null;
            if (epPoster) {
                try {
                    epPoster = new URL(epPoster, BASE).toString();
                }
                catch { }
            }
        }
        if (href)
            episodes.push({ number: numberText, title: titleText || null, url: new URL(href, BASE).toString(), poster: epPoster });
    });
    if (episodes.length === 0) {
        console.log(`parseEpisodesFromHtml: No episodes found in article.post.episodes, trying fallback selectors`);
        const fallbackSelectors = [
            'a[href*="/episode"]',
            '.episode-item a',
            '.episode-list a',
            'article a[href*="/episode"]',
            '.episodes a[href*="/episode"]'
        ];
        for (const selector of fallbackSelectors) {
            $(selector).each((_, a) => {
                const href = $(a).attr('href');
                if (!href)
                    return;
                episodes.push({ title: $(a).text().trim() || null, url: new URL(href, BASE).toString(), poster: null });
            });
            if (episodes.length > 0) {
                console.log(`parseEpisodesFromHtml: Found ${episodes.length} episodes using fallback selector: ${selector}`);
                break;
            }
        }
    }
    console.log(`parseEpisodesFromHtml: Final episodes count: ${episodes.length}`);
    return episodes;
}
function parseSeasonsFromHtml(html) {
    const $ = cheerio.load(html);
    const seasons = [];
    console.log(`parseSeasonsFromHtml: Found ${$('a.season-btn').length} season buttons`);
    $('a.season-btn').each((_, a) => {
        const seasonRaw = $(a).attr('data-season');
        const label = $(a).text().trim();
        const classes = ($(a).attr('class') || '').split(/\s+/);
        const isNonRegional = classes.includes('non-regional');
        let regionalLanguageInfo = {
            isNonRegional: isNonRegional,
            isSubbed: false,
            isDubbed: false,
            languageType: 'unknown'
        };
        if (label.includes('[Sub]')) {
            regionalLanguageInfo.isSubbed = true;
            regionalLanguageInfo.languageType = 'subbed';
        }
        else if (label.includes('[Dub]')) {
            regionalLanguageInfo.isDubbed = true;
            regionalLanguageInfo.languageType = 'dubbed';
        }
        if (isNonRegional && !regionalLanguageInfo.isSubbed && !regionalLanguageInfo.isDubbed) {
            regionalLanguageInfo.isSubbed = true;
            regionalLanguageInfo.languageType = 'subbed';
        }
        console.log(`parseSeasonsFromHtml: Season button - data-season: ${seasonRaw}, label: ${label}, classes: ${classes.join(', ')}, regional: ${JSON.stringify(regionalLanguageInfo)}`);
        if (seasonRaw) {
            const maybeNum = Number(seasonRaw);
            seasons.push({
                season: Number.isFinite(maybeNum) ? maybeNum : seasonRaw,
                label,
                nonRegional: isNonRegional,
                regionalLanguageInfo
            });
        }
    });
    console.log(`parseSeasonsFromHtml: Final seasons count: ${seasons.length}`);
    return seasons;
}
function parseAnimeListFromHtml(html) {
    const $ = cheerio.load(html);
    const items = [];
    const seen = new Set();
    $('article.post').each((_, el) => {
        let href = $(el).find('a[href*="/series/"]').first().attr('href');
        if (!href)
            href = $(el).find('a[href*="/movies/"]').first().attr('href');
        if (!href)
            href = $(el).find('a').first().attr('href') || undefined;
        if (!href)
            return;
        const abs = new URL(href, BASE).toString();
        if (seen.has(abs))
            return;
        seen.add(abs);
        const title = $(el).find('h2.entry-title').first().text().trim() || $(el).find('a').first().text().trim() || null;
        let postId;
        const idAttr = $(el).attr('id') || '';
        const classAttr = $(el).attr('class') || '';
        const idMatch = idAttr.match(/post-(\d+)/) || classAttr.match(/post-(\d+)/);
        if (idMatch && idMatch[1]) {
            const n = Number(idMatch[1]);
            if (Number.isFinite(n))
                postId = n;
        }
        let img = null;
        const imgEl = $(el).find('img').first();
        if (imgEl && imgEl.length) {
            img = imgEl.attr('data-src') || imgEl.attr('data-lazy-src') || imgEl.attr('data-img') || imgEl.attr('data-original') || imgEl.attr('data-thumb') || imgEl.attr('data-thumbnail') || imgEl.attr('src') || null;
            if (img && /^data:/i.test(img))
                img = null;
            if (!img) {
                const srcset = imgEl.attr('srcset') || imgEl.attr('data-srcset') || imgEl.attr('data-lazy-srcset') || '';
                const candidates = srcset.split(',').map(s => s.trim().split(' ')[0]).filter(Boolean).filter(u => !/^data:/i.test(u));
                const pick = candidates[candidates.length - 1] || candidates[0];
                if (pick)
                    img = pick;
            }
        }
        if (!img) {
            const styleEl = $(el).find('[style*="background-image"]').first();
            const style = styleEl.attr('style') || '';
            const m = style.match(/background-image\s*:\s*url\((['\"]?)([^)\'\"]+)\1\)/i);
            if (m && m[2])
                img = m[2];
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
        $('a[href*="/series/"], a[href*="/movies/"]').each((_, a) => {
            const href = $(a).attr('href');
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
async function fetchAnimeList(page) {
    console.log(`fetchAnimeList called with page: ${page}`);
    const payload = new URLSearchParams({ action: 'torofilm_infinite_scroll', page: String(page), per_page: '12', query_type: 'archive', post_type: 'series' });
    let items = [];
    try {
        console.log(`Attempting AJAX call to: ${AJAX}`);
        console.log(`Payload: ${payload.toString()}`);
        const { data } = await http.post(AJAX, payload, { responseType: 'text' });
        console.log(`AJAX response received, data type: ${typeof data}, length: ${typeof data === 'string' ? data.length : 'N/A'}`);
        let html;
        if (typeof data === 'object' && data) {
            const anyData = data;
            if (typeof anyData.html === 'string')
                html = anyData.html;
            else if (typeof anyData.data === 'string')
                html = anyData.data;
            else if (typeof anyData.content === 'string')
                html = anyData.content;
        }
        else if (typeof data === 'string') {
            html = data;
            try {
                const parsed = JSON.parse(data);
                if (parsed && typeof parsed === 'object') {
                    if (typeof parsed.html === 'string')
                        html = parsed.html;
                    else if (typeof parsed.data === 'string')
                        html = parsed.data;
                    else if (typeof parsed.content === 'string')
                        html = parsed.content;
                }
            }
            catch { }
        }
        if (html) {
            console.log(`HTML extracted, length: ${html.length}`);
            items = parseAnimeListFromHtml(html);
            console.log(`Parsed ${items.length} items from AJAX response`);
        }
        else {
            console.log('No HTML found in AJAX response');
        }
    }
    catch (error) {
        console.error('AJAX call failed:', error);
    }
    if (items.length === 0) {
        const candidates = [];
        if (page <= 1) {
            candidates.push(`${BASE}/series/`);
            candidates.push(`${BASE}/movies/`);
            candidates.push(`${BASE}/`);
        }
        candidates.push(`${BASE}/series/page/${page}/`);
        candidates.push(`${BASE}/movies/page/${page}/`);
        candidates.push(`${BASE}/series/?_page=${page}`);
        candidates.push(`${BASE}/movies/?_page=${page}`);
        candidates.push(`${BASE}/?post_type=series&_page=${page}`);
        candidates.push(`${BASE}/?post_type=movies&_page=${page}`);
        console.log(`AJAX failed, trying fallback URLs: ${candidates.join(', ')}`);
        for (const url of candidates) {
            try {
                console.log(`Trying fallback URL: ${url}`);
                const resp = await http.get(url, { responseType: 'text' });
                const html = String(resp.data || '');
                const parsed = parseAnimeListFromHtml(html);
                console.log(`Fallback ${url} returned ${parsed.length} items`);
                if (parsed.length > 0) {
                    items = parsed;
                    console.log(`Using fallback data from: ${url}`);
                    break;
                }
            }
            catch (err) {
                console.log(`Fallback ${url} failed:`, err);
            }
        }
    }
    console.log(`Enriching ${items.length} items with posters`);
    items = await enrichSeriesPosters(items);
    console.log(`Final result: ${items.length} items`);
    return { page, items };
}
function parsePosterFromHtml(html, baseUrl) {
    const $ = cheerio.load(html);
    let img = null;
    const og = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
    if (og)
        img = og;
    if (!img) {
        const cover = $('.cover img, .poster img, .entry-thumb img').first();
        const src = cover.attr('src') || cover.attr('data-src') || cover.attr('data-original');
        if (src)
            img = src;
    }
    if (!img) {
        const candidates = [];
        $('img').each((_, el) => {
            const s = $(el).attr('data-src') || $(el).attr('src');
            if (!s)
                return;
            candidates.push(s);
        });
        const scored = candidates.map((u) => {
            const urlStr = (() => { try {
                return new URL(u, baseUrl).toString();
            }
            catch {
                return u;
            } })();
            const hostScore = /image\.tmdb\.org/i.test(urlStr) ? 2 : 0;
            const sizeScore = /(original|w780|w500|w342|w300|w185)/i.test(urlStr) ? 1 : 0;
            return { urlStr, score: hostScore + sizeScore };
        }).sort((a, b) => b.score - a.score);
        if (scored.length)
            img = scored[0].urlStr;
    }
    if (img) {
        try {
            img = new URL(img, baseUrl).toString();
        }
        catch { }
    }
    return img;
}
function parseMetaFromHtml(html) {
    const $ = cheerio.load(html);
    const out = {};
    const genreTexts = $("a[rel='tag'], .genres a, .genre a").map((_, el) => $(el).text().trim()).get().filter(Boolean);
    if (genreTexts.length)
        out.genres = Array.from(new Set(genreTexts));
    const text = $('body').text();
    const ym = text.match(/\b(19|20)\d{2}\b/);
    if (ym)
        out.year = Number(ym[0]);
    const epm = text.match(/Episodes?\s*[:|-]?\s*(\d+)/i);
    if (epm)
        out.totalEpisodes = Number(epm[1]);
    const durm = text.match(/(\d+\s*(min|minutes|mins))/i);
    if (durm)
        out.duration = durm[0];
    const langs = [];
    if (/subbed/i.test(text))
        langs.push('Sub');
    if (/dubbed|dub/i.test(text))
        langs.push('Dub');
    if (langs.length)
        out.languages = Array.from(new Set(langs));
    const synopsis = $('.entry-content p, .synopsis, .description').first().text().trim();
    if (synopsis)
        out.synopsis = synopsis;
    const statusMatch = text.match(/Status\s*[:|-]?\s*(Ongoing|Completed|Finished|Airing)/i);
    if (statusMatch)
        out.status = statusMatch[1];
    return out;
}
async function fetchAnimeDetails(params) {
    const { url, postId, season } = params;
    if (/\/movies\//i.test(url)) {
        return await fetchMovieDetails(url);
    }
    const pageResp = await http.get(url);
    const html = pageResp.data;
    const nonce = extractNonceFromHtml(html);
    const seasons = parseSeasonsFromHtml(html);
    const poster = parsePosterFromHtml(html, url);
    const meta = parseMetaFromHtml(html);
    const resolvedPostId = Number.isFinite(postId) && postId > 0 ? postId : (extractPostIdFromHtml(html) ?? 0);
    let episodes = [];
    if (typeof season === 'number' && Number.isFinite(season)) {
        console.log(`fetchAnimeDetails: Fetching episodes for season ${season}, postId: ${resolvedPostId}`);
        try {
            const payload = new URLSearchParams({ action: 'action_select_season', season: String(season), post: String(resolvedPostId) });
            const resp = await http.post(AJAX, payload, { headers: { Referer: url } });
            const text = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
            console.log(`fetchAnimeDetails: Season ${season} response length: ${text.length}`);
            episodes = parseEpisodesFromHtml(text);
            console.log(`fetchAnimeDetails: Parsed ${episodes.length} episodes for season ${season}`);
        }
        catch (error) {
            console.error(`fetchAnimeDetails: Error fetching season ${season}:`, error);
            episodes = parseEpisodesFromHtml(html);
        }
    }
    else {
        if (Number.isFinite(resolvedPostId) && resolvedPostId > 0) {
            try {
                const payload = new URLSearchParams({ action: 'torofilm_get_episodes', id: String(resolvedPostId), nonce: nonce || '' });
                const resp = await http.post(AJAX, payload, { headers: { Referer: url } });
                const body = resp.data;
                if (typeof body === 'string') {
                    const trimmed = body.trim();
                    if (trimmed !== '' && trimmed !== '0') {
                        try {
                            const parsed = JSON.parse(body);
                            if (parsed && typeof parsed === 'object' && 'html' in parsed) {
                                episodes = parseEpisodesFromHtml(parsed.html);
                            }
                        }
                        catch {
                            episodes = parseEpisodesFromHtml(body);
                        }
                    }
                }
                else if (typeof body === 'object' && body && 'html' in body) {
                    episodes = parseEpisodesFromHtml(body.html);
                }
            }
            catch {
            }
        }
    }
    if (episodes.length === 0)
        episodes = parseEpisodesFromHtml(html);
    const $ = cheerio.load(html);
    const related = [];
    const seenRelated = new Set();
    const normalizeSrc = (src) => {
        if (!src)
            return null;
        let out = src.trim();
        if (out.startsWith('//'))
            return `https:${out}`;
        if (out.startsWith('/'))
            return new URL(out, url).toString();
        return out;
    };
    const selectors = [
        'section.section.episodes .owl-item article.post',
        'section.section.episodes article.post',
        '.section.episodes .owl-carousel .owl-item article.post',
        '.owl-carousel .owl-item article.post',
        '.recommended .post',
        '.related .post',
        'article.post'
    ];
    for (const selector of selectors) {
        const candidates = $(selector);
        if (candidates.length === 0)
            continue;
        candidates.each((_, el) => {
            try {
                const art = $(el);
                const a = art.find('a[href*="/series/"], a[href*="/movies/"]').first();
                const href = a.attr('href');
                if (!href)
                    return;
                const abs = new URL(href, url).toString();
                if (seenRelated.has(abs))
                    return;
                const imgEl = art.find('img').first();
                let img = normalizeSrc(imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('data-lazy'));
                const titleRaw = imgEl.attr('alt') || art.find('h3,h2,.entry-title').first().text() || null;
                const title = titleRaw ? titleRaw.replace(/^Image\s+/i, '').trim() : null;
                related.push({ url: abs, title, poster: img });
                seenRelated.add(abs);
            }
            catch { }
        });
        if (related.length > 0)
            break;
    }
    if (related.length > 20)
        related.length = 20;
    const smartButtons = [];
    $('.smart-buttons-container .smart-play-btn').each((_, el) => {
        const $btn = $(el);
        const href = $btn.attr('href');
        const actionText = $btn.find('.action-text').text().trim();
        const episodeText = $btn.find('.episode-text').text().trim();
        const btnClass = $btn.attr('class') || '';
        if (href && actionText) {
            smartButtons.push({
                url: href,
                actionText: actionText,
                episodeText: episodeText,
                buttonClass: btnClass
            });
        }
    });
    return { url, postId: resolvedPostId, season: season ?? null, seasons, episodes, poster, related, smartButtons, ...meta };
}
async function fetchEpisodePlayers(episodeUrl) {
    console.log(`fetchEpisodePlayers: Processing URL: ${episodeUrl}`);
    let normalizedUrl;
    try {
        if (episodeUrl.startsWith('http://') || episodeUrl.startsWith('https://')) {
            normalizedUrl = episodeUrl;
        }
        else {
            normalizedUrl = new URL(episodeUrl, BASE).toString();
        }
        new URL(normalizedUrl);
        console.log(`fetchEpisodePlayers: Normalized URL: ${normalizedUrl}`);
    }
    catch (error) {
        console.error(`fetchEpisodePlayers: Invalid URL - ${episodeUrl}:`, error);
        throw new Error(`Invalid episode URL: ${episodeUrl}`);
    }
    const resp = await http.get(normalizedUrl, { responseType: 'text' });
    const html = String(resp.data || '');
    const $ = cheerio.load(html);
    const sources = [];
    $('iframe').each((_, el) => { const src = $(el).attr('data-src') || $(el).attr('src'); if (!src)
        return; sources.push({ src: new URL(src, normalizedUrl).toString(), kind: 'iframe' }); });
    $('video source').each((_, el) => { const src = $(el).attr('src'); if (!src)
        return; sources.push({ src: new URL(src, normalizedUrl).toString(), label: $(el).attr('label') || $(el).attr('data-label') || null, quality: $(el).attr('res') || $(el).attr('data-res') || null, kind: 'video' }); });
    const m3u8Match = html.match(/https?:[^"'\s]+\.m3u8/);
    if (m3u8Match) {
        try {
            sources.push({ src: new URL(m3u8Match[0], normalizedUrl).toString(), kind: 'video', label: 'HLS' });
        }
        catch { }
    }
    const seen = new Set();
    return sources.filter(s => (seen.has(s.src) ? false : (seen.add(s.src), true)));
}
async function enrichSeriesPosters(items) {
    const targets = items.map((it, idx) => ({ it, idx })).filter(({ it }) => !it.image || it.image.startsWith('data:'));
    if (targets.length === 0)
        return items;
    await Promise.allSettled(targets.map(async ({ it, idx }) => {
        try {
            const resp = await http.get(it.url, { responseType: 'text' });
            const html = String(resp.data || '');
            const poster = parsePosterFromHtml(html, it.url);
            if (poster)
                items[idx] = { ...it, image: poster };
        }
        catch { }
    }));
    return items;
}
async function fetchMoviesList(page, query) {
    let items = [];
    try {
        if (query && query.trim().length > 0) {
            console.log(`Fetching movies with query: ${query}`);
            const axios = (await Promise.resolve().then(() => __importStar(require('axios')))).default;
            const { data: html } = await axios.get(`${BASE}/?s=${encodeURIComponent(query)}`, {
                headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000,
            });
            const all = parseAnimeListFromHtml(String(html));
            items = all.filter((i) => /\/movies\//i.test(i.url));
            console.log(`Query search found ${all.length} total items, ${items.length} movies`);
        }
        else {
            console.log(`Fetching movies page ${page}`);
            const candidates = [];
            if (page <= 1)
                candidates.push(`${BASE}/movies/`);
            candidates.push(`${BASE}/movies/page/${page}/`);
            console.log(`Trying URLs: ${candidates.join(', ')}`);
            for (const url of candidates) {
                try {
                    console.log(`Attempting to fetch: ${url}`);
                    const resp = await http.get(url, { responseType: 'text' });
                    const html = String(resp.data || '');
                    console.log(`Got response from ${url}, HTML length: ${html.length}`);
                    const parsed = parseAnimeListFromHtml(html).filter((i) => /\/movies\//i.test(i.url));
                    console.log(`Parsed ${parsed.length} movies from ${url}`);
                    if (parsed.length) {
                        items = parsed;
                        console.log(`Successfully loaded ${items.length} movies from ${url}`);
                        break;
                    }
                }
                catch (err) {
                    console.error(`Failed to fetch ${url}:`, err);
                }
            }
            if (items.length === 0) {
                console.log('No movies found from dedicated pages, trying main page as fallback');
                try {
                    const mainResp = await http.get(`${BASE}/`, { responseType: 'text' });
                    const mainHtml = String(mainResp.data || '');
                    const mainParsed = parseAnimeListFromHtml(mainHtml).filter((i) => /\/movies\//i.test(i.url));
                    console.log(`Fallback: Found ${mainParsed.length} movies from main page`);
                    if (mainParsed.length > 0) {
                        items = mainParsed;
                    }
                }
                catch (err) {
                    console.error('Fallback main page fetch failed:', err);
                }
            }
        }
    }
    catch (err) {
        console.error('Error in fetchMoviesList:', err);
        throw new Error(`Failed to fetch movies: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    console.log(`Final items count: ${items.length}`);
    if (items.length === 0) {
        console.warn('No movies found, this might indicate an issue with the scraper or the source website');
    }
    items = await enrichSeriesPosters(items);
    return { page, items };
}
async function fetchMovieDetails(url) {
    const pageResp = await http.get(url);
    const html = pageResp.data;
    const poster = parsePosterFromHtml(html, url);
    const meta = parseMetaFromHtml(html);
    const players = extractPlayersFromHtml(html, url);
    const episodes = [{ title: 'Full Movie', url, number: null, poster }];
    return {
        url,
        postId: 0,
        season: null,
        seasons: [],
        episodes,
        poster,
        ...meta,
        players,
    };
}
function extractPlayersFromHtml(html, baseUrl) {
    const $ = cheerio.load(html);
    const sources = [];
    $('iframe').each((_, el) => {
        const src = $(el).attr('data-src') || $(el).attr('src');
        if (!src)
            return;
        try {
            const fullUrl = new URL(src, baseUrl).toString();
            sources.push({ src: fullUrl, kind: 'iframe', label: 'Server 1' });
        }
        catch { }
    });
    $('video source').each((_, el) => {
        const src = $(el).attr('src');
        if (!src)
            return;
        try {
            const fullUrl = new URL(src, baseUrl).toString();
            sources.push({
                src: fullUrl,
                kind: 'video',
                label: $(el).attr('label') || 'Video',
                quality: $(el).attr('res') || null
            });
        }
        catch { }
    });
    const m3u8 = html.match(/https?:[^"'\s]+\.m3u8/);
    if (m3u8) {
        try {
            const fullUrl = new URL(m3u8[0], baseUrl).toString();
            sources.push({ src: fullUrl, kind: 'video', label: 'HLS Stream' });
        }
        catch { }
    }
    try {
        const server2 = $('.video-container iframe#videoFrame').first();
        if (server2 && server2.length) {
            const s2src = server2.attr('data-src') || server2.attr('src');
            if (s2src) {
                const fullUrl = new URL(s2src, baseUrl).toString();
                let lang = null;
                const langSpan = server2.parent().find('#switchingLanguage').first();
                if (langSpan && langSpan.length) {
                    const t = (langSpan.text() || '').trim();
                    if (t)
                        lang = t;
                }
                sources.push({ src: fullUrl, kind: 'iframe', label: lang ? `Server 2 (${lang})` : 'Server 2' });
            }
        }
    }
    catch { }
    $('a[href*="play"], a[href*="watch"], a[href*="stream"]').each((_, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        if (!href)
            return;
        try {
            const fullUrl = new URL(href, baseUrl).toString();
            if (fullUrl.includes('play') || fullUrl.includes('watch') || fullUrl.includes('stream')) {
                sources.push({
                    src: fullUrl,
                    kind: 'iframe',
                    label: text || 'Server'
                });
            }
        }
        catch { }
    });
    const seen = new Set();
    return sources.filter((s) => (seen.has(s.src) ? false : (seen.add(s.src), true)));
}
async function fetchCartoonList(page = 1, query = '') {
    console.log(`Fetching cartoon list - Page: ${page}, Query: ${query}`);
    let items = [];
    try {
        if (query) {
            const searchUrl = `${BASE}/?s=${encodeURIComponent(query)}&post_type=post`;
            console.log(`Searching cartoons with query: ${searchUrl}`);
            const searchResp = await http.get(searchUrl, { responseType: 'text' });
            const searchHtml = String(searchResp.data || '');
            const allResults = parseAnimeListFromHtml(searchHtml);
            items = allResults.filter((item) => item.url.includes('/cartoon/') ||
                (item.title && item.title.toLowerCase().includes('cartoon')) ||
                (item.title && item.title.toLowerCase().includes('animation')));
            console.log(`Search found ${items.length} cartoon results for query: "${query}"`);
        }
        else {
            const cartoonUrl = `${BASE}/category/cartoon/`;
            if (page > 1) {
                const pageUrl = `${cartoonUrl}page/${page}/`;
                console.log(`Fetching cartoon page: ${pageUrl}`);
                try {
                    const pageResp = await http.get(pageUrl, { responseType: 'text' });
                    const pageHtml = String(pageResp.data || '');
                    items = parseAnimeListFromHtml(pageHtml);
                    console.log(`Page ${page} found ${items.length} cartoons`);
                }
                catch (err) {
                    console.error(`Failed to fetch cartoon page ${page}:`, err);
                    const mainResp = await http.get(cartoonUrl, { responseType: 'text' });
                    const mainHtml = String(mainResp.data || '');
                    items = parseAnimeListFromHtml(mainHtml);
                    console.log(`Fallback: Found ${items.length} cartoons from main cartoon page`);
                }
            }
            else {
                console.log(`Fetching main cartoon page: ${cartoonUrl}`);
                const mainResp = await http.get(cartoonUrl, { responseType: 'text' });
                const mainHtml = String(mainResp.data || '');
                items = parseAnimeListFromHtml(mainHtml);
                console.log(`Main cartoon page found ${items.length} cartoons`);
            }
            if (items.length === 0) {
                console.log('No cartoons found from dedicated pages, trying main page as fallback');
                try {
                    const mainResp = await http.get(`${BASE}/`, { responseType: 'text' });
                    const mainHtml = String(mainResp.data || '');
                    const mainParsed = parseAnimeListFromHtml(mainHtml).filter((i) => i.url.includes('/cartoon/') ||
                        (i.title && i.title.toLowerCase().includes('cartoon')) ||
                        (i.title && i.title.toLowerCase().includes('animation')));
                    console.log(`Fallback: Found ${mainParsed.length} cartoons from main page`);
                    if (mainParsed.length > 0) {
                        items = mainParsed;
                    }
                }
                catch (err) {
                    console.error('Fallback main page fetch failed:', err);
                }
            }
        }
    }
    catch (err) {
        console.error('Error in fetchCartoonList:', err);
        throw new Error(`Failed to fetch cartoons: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    console.log(`Final cartoon items count: ${items.length}`);
    if (items.length === 0) {
        console.warn('No cartoons found, this might indicate an issue with the scraper or the source website');
    }
    items = await enrichSeriesPosters(items);
    return { page, items };
}
async function fetchNetworkContent(networkSlug, page = 1, query = '') {
    console.log(`Fetching ${networkSlug} network content - Page: ${page}, Query: ${query}`);
    let items = [];
    try {
        if (query) {
            const searchUrl = `${BASE}/?s=${encodeURIComponent(query)}&post_type=post`;
            console.log(`Searching ${networkSlug} content with query: ${searchUrl}`);
            const searchResp = await http.get(searchUrl, { responseType: 'text' });
            const searchHtml = String(searchResp.data || '');
            const allResults = parseAnimeListFromHtml(searchHtml);
            items = allResults.filter((item) => item.url.includes(`/network/${networkSlug}/`) ||
                (item.title && item.title.toLowerCase().includes(networkSlug.replace('-', ' '))));
            console.log(`Search found ${items.length} ${networkSlug} results for query: "${query}"`);
        }
        else {
            const networkUrl = `${BASE}/category/network/${networkSlug}/`;
            if (page > 1) {
                const pageUrl = `${networkUrl}page/${page}/`;
                console.log(`Fetching ${networkSlug} page: ${pageUrl}`);
                try {
                    const pageResp = await http.get(pageUrl, { responseType: 'text' });
                    const pageHtml = String(pageResp.data || '');
                    items = parseAnimeListFromHtml(pageHtml);
                    console.log(`Page ${page} found ${items.length} ${networkSlug} items`);
                }
                catch (err) {
                    console.error(`Failed to fetch ${networkSlug} page ${page}:`, err);
                    const mainResp = await http.get(networkUrl, { responseType: 'text' });
                    const mainHtml = String(mainResp.data || '');
                    items = parseAnimeListFromHtml(mainHtml);
                    console.log(`Fallback: Found ${items.length} ${networkSlug} items from main network page`);
                }
            }
            else {
                console.log(`Fetching main ${networkSlug} page: ${networkUrl}`);
                const mainResp = await http.get(networkUrl, { responseType: 'text' });
                const mainHtml = String(mainResp.data || '');
                items = parseAnimeListFromHtml(mainHtml);
                console.log(`Main ${networkSlug} page found ${items.length} items`);
            }
            if (items.length === 0) {
                console.log(`No ${networkSlug} content found from dedicated pages, trying main page as fallback`);
                try {
                    const mainResp = await http.get(`${BASE}/`, { responseType: 'text' });
                    const mainHtml = String(mainResp.data || '');
                    const mainParsed = parseAnimeListFromHtml(mainHtml).filter((i) => i.url.includes(`/network/${networkSlug}/`) ||
                        (i.title && i.title.toLowerCase().includes(networkSlug.replace('-', ' '))));
                    console.log(`Fallback: Found ${mainParsed.length} ${networkSlug} items from main page`);
                    if (mainParsed.length > 0) {
                        items = mainParsed;
                    }
                }
                catch (err) {
                    console.error('Fallback main page fetch failed:', err);
                }
            }
        }
    }
    catch (err) {
        console.error(`Error in fetchNetworkContent for ${networkSlug}:`, err);
        throw new Error(`Failed to fetch ${networkSlug} content: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    console.log(`Final ${networkSlug} items count: ${items.length}`);
    if (items.length === 0) {
        console.warn(`No ${networkSlug} content found, this might indicate an issue with the scraper or the source website`);
    }
    items = await enrichSeriesPosters(items);
    return { page, items };
}
async function fetchOngoingSeries(page = 1, query = '') {
    console.log(`Fetching ongoing series - Page: ${page}, Query: ${query}`);
    let items = [];
    try {
        if (query) {
            const searchUrl = `${BASE}/?s=${encodeURIComponent(query)}&post_type=post`;
            console.log(`Searching ongoing series with query: ${searchUrl}`);
            const searchResp = await http.get(searchUrl, { responseType: 'text' });
            const searchHtml = String(searchResp.data || '');
            const allResults = parseAnimeListFromHtml(searchHtml);
            items = allResults.filter((item) => item.url.includes('/status/ongoing/') ||
                (item.title && item.title.toLowerCase().includes('ongoing')) ||
                (item.title && item.title.toLowerCase().includes('airing')));
            console.log(`Search found ${items.length} ongoing series results for query: "${query}"`);
        }
        else {
            const ongoingUrl = `${BASE}/category/status/ongoing/`;
            if (page > 1) {
                const pageUrl = `${ongoingUrl}page/${page}/`;
                console.log(`Fetching ongoing series page: ${pageUrl}`);
                try {
                    const pageResp = await http.get(pageUrl, { responseType: 'text' });
                    const pageHtml = String(pageResp.data || '');
                    items = parseAnimeListFromHtml(pageHtml);
                    console.log(`Page ${page} found ${items.length} ongoing series`);
                }
                catch (err) {
                    console.error(`Failed to fetch ongoing series page ${page}:`, err);
                    const mainResp = await http.get(ongoingUrl, { responseType: 'text' });
                    const mainHtml = String(mainResp.data || '');
                    items = parseAnimeListFromHtml(mainHtml);
                    console.log(`Fallback: Found ${items.length} ongoing series from main page`);
                }
            }
            else {
                console.log(`Fetching main ongoing series page: ${ongoingUrl}`);
                const mainResp = await http.get(ongoingUrl, { responseType: 'text' });
                const mainHtml = String(mainResp.data || '');
                items = parseAnimeListFromHtml(mainHtml);
                console.log(`Main ongoing series page found ${items.length} items`);
            }
            if (items.length === 0) {
                console.log('No ongoing series found from dedicated pages, trying main page as fallback');
                try {
                    const mainResp = await http.get(`${BASE}/`, { responseType: 'text' });
                    const mainHtml = String(mainResp.data || '');
                    const mainParsed = parseAnimeListFromHtml(mainHtml).filter((i) => i.url.includes('/status/ongoing/') ||
                        (i.title && i.title.toLowerCase().includes('ongoing')) ||
                        (i.title && i.title.toLowerCase().includes('airing')));
                    console.log(`Fallback: Found ${mainParsed.length} ongoing series from main page`);
                    if (mainParsed.length > 0) {
                        items = mainParsed;
                    }
                }
                catch (err) {
                    console.error('Fallback main page fetch failed:', err);
                }
            }
        }
    }
    catch (err) {
        console.error('Error in fetchOngoingSeries:', err);
        throw new Error(`Failed to fetch ongoing series: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    console.log(`Final ongoing series items count: ${items.length}`);
    if (items.length === 0) {
        console.warn('No ongoing series found, this might indicate an issue with the scraper or the source website');
    }
    items = await enrichSeriesPosters(items);
    return { page, items };
}
async function fetchUpcomingEpisodes() {
    console.log('Fetching upcoming episodes data');
    try {
        const response = await http.get(`${BASE}/`, { responseType: 'text' });
        const html = String(response.data || '');
        const episodes = [];
        const episodePattern = /<div class="swiper-slide upcoming-ep-swiper-slide[^>]*>.*?<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>.*?<span class="year">([^<]*)<\/span>.*?<span class="countdown-timer"[^>]*data-target="([^"]*)"[^>]*>.*?<a href="([^"]*)"[^>]*class="lnk-blk"[^>]*>/gs;
        let match;
        let id = 1;
        while ((match = episodePattern.exec(html)) !== null) {
            const [, imageSrc, title, episode, countdown, url] = match;
            const cleanImage = imageSrc.startsWith('//') ? `https:${imageSrc}` : imageSrc;
            const cleanTitle = title.replace(/Image\s+/i, '').trim();
            const cleanEpisode = episode.trim();
            const cleanUrl = url.replace(BASE, '');
            const countdownTimestamp = parseInt(countdown, 10);
            if (cleanTitle && cleanEpisode && countdownTimestamp) {
                episodes.push({
                    id: id.toString(),
                    title: cleanTitle,
                    image: cleanImage,
                    episode: cleanEpisode,
                    countdown: countdownTimestamp,
                    url: cleanUrl
                });
                id++;
            }
        }
        console.log(`Found ${episodes.length} upcoming episodes`);
        if (episodes.length === 0) {
            console.log('No episodes found with regex, trying alternative parsing...');
            const upcomingSection = html.match(/<section[^>]*id="torofilm_upcoming_episodes[^>]*>([\s\S]*?)<\/section>/i);
            if (upcomingSection) {
                const sectionHtml = upcomingSection[1];
                const cardPattern = /<article[^>]*class="post[^>]*>.*?<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>.*?<span class="year">([^<]*)<\/span>.*?<span class="countdown-timer"[^>]*data-target="([^"]*)"[^>]*>.*?<a href="([^"]*)"[^>]*class="lnk-blk"[^>]*>/gs;
                while ((match = cardPattern.exec(sectionHtml)) !== null) {
                    const [, imageSrc, title, episode, countdown, url] = match;
                    const cleanImage = imageSrc.startsWith('//') ? `https:${imageSrc}` : imageSrc;
                    const cleanTitle = title.replace(/Image\s+/i, '').trim();
                    const cleanEpisode = episode.trim();
                    const cleanUrl = url.replace(BASE, '');
                    const countdownTimestamp = parseInt(countdown, 10);
                    if (cleanTitle && cleanEpisode && countdownTimestamp) {
                        episodes.push({
                            id: id.toString(),
                            title: cleanTitle,
                            image: cleanImage,
                            episode: cleanEpisode,
                            countdown: countdownTimestamp,
                            url: cleanUrl
                        });
                        id++;
                    }
                }
            }
        }
        if (episodes.length === 0) {
            console.log('No episodes found, returning fallback data');
            return {
                episodes: [
                    {
                        id: "1",
                        title: "Clevatess",
                        image: "https://image.tmdb.org/t/p/w500/31I6eGFgYbbn5FMwzxOVlZfYETW.jpg",
                        episode: "EP:9",
                        countdown: Math.floor(Date.now() / 1000) + (6 * 60 * 60),
                        url: "/series/clevatess"
                    },
                    {
                        id: "2",
                        title: "Naruto Shippuden",
                        image: "https://image.tmdb.org/t/p/w500/kV27j3Nz4d5z8u6mN3EJw9RiLg2.jpg",
                        episode: "EP:242-243",
                        countdown: Math.floor(Date.now() / 1000) + (9 * 60 * 60),
                        url: "/series/naruto-shippuden"
                    }
                ]
            };
        }
        return { episodes };
    }
    catch (error) {
        console.error('Error fetching upcoming episodes:', error);
        return {
            episodes: [
                {
                    id: "1",
                    title: "Clevatess",
                    image: "https://image.tmdb.org/t/p/w500/31I6eGFgYbbn5FMwzxOVlZfYETW.jpg",
                    episode: "EP:9",
                    countdown: Math.floor(Date.now() / 1000) + (6 * 60 * 60),
                    url: "/series/clevatess"
                },
                {
                    id: "2",
                    title: "Naruto Shippuden",
                    image: "https://image.tmdb.org/t/p/w500/kV27j3Nz4d5z8u6mN3EJw9RiLg2.jpg",
                    episode: "EP:242-243",
                    countdown: Math.floor(Date.now() / 1000) + (9 * 60 * 60),
                    url: "/series/naruto-shippuden"
                }
            ]
        };
    }
}
//# sourceMappingURL=scraper.js.map