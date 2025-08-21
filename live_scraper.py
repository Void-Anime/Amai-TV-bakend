# live_scraper.py
from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
import requests, re
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from typing import Optional, List, Dict

app = FastAPI()

BASE = "https://animesalt.cc"
AJAX = f"{BASE}/wp-admin/admin-ajax.php"
SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": "Mozilla/5.0",
    "Referer": BASE,
    "Origin": BASE,
    "X-Requested-With": "XMLHttpRequest",
})


def extract_nonce_from_html(html: str):
    m = re.search(r'"nonce"\s*:\s*"([a-f0-9]+)"', html)
    return m.group(1) if m else None


def parse_episodes_from_html(html: str):
    """Extract episodes from episode list HTML."""
    soup = BeautifulSoup(html, "html.parser")
    episodes: List[Dict] = []

    for article in soup.select("article.post.episodes"):
        link = article.select_one('a[href*="/episode"]')
        href = link.get("href") if link else None

        title_el = article.select_one("h2.entry-title")
        title = title_el.get_text(strip=True) if title_el else (link.get_text(strip=True) if link else None)

        number_el = article.select_one(".num-epi")
        number = number_el.get_text(strip=True) if number_el else None

        if href:
            episodes.append({
                "number": number,
                "title": title,
                "url": urljoin(BASE, href),
            })

    if not episodes:
        for a in soup.select('a[href*="/episode"]'):
            href = a.get("href")
            if not href:
                continue
            episodes.append({
                "title": a.get_text(strip=True) or None,
                "url": urljoin(BASE, href),
            })

    return episodes


def parse_seasons_from_html(html: str):
    """Extract available seasons from the anime page HTML."""
    soup = BeautifulSoup(html, "html.parser")
    seasons: List[Dict] = []
    for a in soup.select("a.season-btn"):
        season_raw = a.get("data-season")
        label = a.get_text(strip=True)
        classes = a.get("class", [])
        is_non_regional = "non-regional" in classes
        if season_raw:
            try:
                season_num: Optional[int] = int(season_raw)
            except ValueError:
                season_num = None
            seasons.append({
                "season": season_num if season_num is not None else season_raw,
                "label": label,
                "non_regional": is_non_regional,
            })
    return seasons


@app.get("/anime_list")
def get_anime_list(page: int = Query(1, ge=1)):
    """Get anime list from infinite scroll API"""
    payload = {
        "action": "torofilm_infinite_scroll",
        "page": page,
        "per_page": 12,
        "query_type": "archive",
        "post_type": "series",
    }
    r = SESSION.post(AJAX, data=payload, timeout=20)
    data = r.json()
    return JSONResponse(data)


@app.get("/anime_details")
def get_anime_details(url: str, post_id: int, season: Optional[int] = Query(None, ge=1)):
    """Get details + episodes for one anime."""
    r = SESSION.get(url, timeout=20)
    html = r.text
    nonce = extract_nonce_from_html(html)
    seasons = parse_seasons_from_html(html)

    episodes: List[Dict] = []

    if season is not None:
        payload = {"action": "action_select_season", "season": season, "post": post_id}
        resp = SESSION.post(AJAX, data=payload, headers={"Referer": url}, timeout=20)
        episodes = parse_episodes_from_html(resp.text)
    else:
        payload = {"action": "torofilm_get_episodes", "id": post_id, "nonce": nonce}
        resp = SESSION.post(AJAX, data=payload, headers={"Referer": url}, timeout=20)

        if resp.text.strip() not in ["", "0"]:
            try:
                data = resp.json()
                if "html" in data:
                    episodes = parse_episodes_from_html(data["html"])
            except Exception:
                episodes = parse_episodes_from_html(resp.text)

    if not episodes:
        episodes = parse_episodes_from_html(html)

    return {
        "url": url,
        "post_id": post_id,
        "season": season,
        "seasons": seasons,
        "episodes": episodes,
    }


@app.get("/episode_player")
def get_episode_player(url: str):
    """Scrape the episode player iframe from an episode page."""
    r = SESSION.get(url, timeout=20)
    soup = BeautifulSoup(r.text, "html.parser")

    iframe = soup.select_one("iframe[src*='zephyrflick']")
    if not iframe:
        return {"url": url, "player": None, "message": "No iframe found"}

    player_url = iframe.get("src")
    data_src = iframe.get("data-src")

    return {
        "url": url,
        "player": {
            "src": player_url,
            "data_src": data_src,
            "iframe_html": str(iframe),
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
