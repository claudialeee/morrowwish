#!/usr/bin/env python3
"""Owner-approved Morrow Wish YouTube V14 relaunch using the official YouTube Data API.

Run locally after creating a Google Cloud Desktop OAuth client:
  python3 -m pip install -r scripts/requirements-youtube-upload.txt
  python3 scripts/upload-youtube-v14.py

OAuth client JSON: ~/.config/morrowwish/youtube-client.json
Tokens and publish ledger are stored outside the Git repository, mode 0600.
Seven videos are read exclusively from the latest live /promo/review/ manifest.
"""
from __future__ import annotations
import datetime as dt
import json
import os
from pathlib import Path
import tempfile
import time
import urllib.parse
import urllib.request

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

HOST = "https://morrowwish.vercel.app"
MANIFEST = HOST + "/promo/latest-review.json"
CHANNEL = "UC9v31QGhSfBASDsbXMjch4Q"
SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
]
CONFIG = Path.home() / ".config" / "morrowwish"
CLIENT = CONFIG / "youtube-client.json"
TOKEN = CONFIG / "youtube-oauth-token.json"
LEDGER = CONFIG / "youtube-v14-release-20261122.json"
FIRST_SLOT_UTC = dt.datetime(2026, 11, 23, 3, 0, tzinfo=dt.timezone.utc)
ORDER = [
    ("pocket-aquarium", "Pocket Aquarium — Can You Beat This Fish Combo? #Shorts",
     "Looks peaceful... until the timer starts. Feed the fish, build your combo, and chase your best score. Can you do better? #PocketAquarium #IndieGame #BrowserGame"),
    ("parcel-panic", "Parcel Panic — Can You Survive the Express Orders? #Shorts",
     "Looks easy? Wait until the express orders hit! One life left. Can you survive the shift? #ParcelPanic #IndieGame #BrowserGame"),
    ("flip-dash", "Flip Dash — One Wrong Flip and It's Over! #Shorts",
     "One tap. One gravity flip. One tiny mistake... game over. How far can you survive? #FlipDash #IndieGame #ArcadeGame"),
    ("elsewhere", "Elsewhere — What If You Could Choose Another Life? #Shorts",
     "A new city. A different future. One choice can change everything. Which life would you live? #ElsewhereGame #IndieGame #StoryGame"),
    ("tiny-town", "Tiny Town — No Jobs. Just Build Your Dream Town! #Shorts",
     "Seven days. Five neighbors. A town full of wishes. What would you build first? #TinyTown #CozyGame #IndieGame"),
    ("pawsibly-innocent", "Pawsibly Innocent — Steal the Fish. Don't Get Caught! #Shorts",
     "A sneaky cat. Three fish to steal. One very suspicious human. Can you escape without getting caught? #PawsiblyInnocent #CatGame #IndieGame"),
    ("cat-bond", "Cat Bond — TWO Cats, ONE Legendary Ultimate! #Shorts",
     "Two cats. One legendary duo finisher. Build your dream cat team, unleash the combo, and meet rare new friends. Which cats would you choose? #CatBond #CatGame #IndieGame #BrowserGame"),
]


def read_json(path: Path, fallback=None):
    if not path.exists():
        return {} if fallback is None else fallback
    return json.loads(path.read_text("utf-8"))


def save_json(path: Path, obj: object):
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    temp = path.with_name(path.name + ".tmp")
    with temp.open("w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
    temp.chmod(0o600)
    temp.replace(path)


def get_oauth():
    CONFIG.mkdir(parents=True, exist_ok=True, mode=0o700)
    client_path = Path(os.getenv("YOUTUBE_OAUTH_CLIENT_FILE", str(CLIENT))).expanduser()
    if not client_path.is_file():
        raise SystemExit(
            "Google OAuth client missing. Download a Desktop OAuth JSON from "
            "Google Cloud (YouTube Data API v3 enabled) and save it as: " + str(client_path)
        )
    client = read_json(client_path)
    if "installed" not in client:
        raise SystemExit("Create an OAuth client of type DESKTOP APP, not Web application.")
    creds = Credentials.from_authorized_user_file(str(TOKEN), SCOPES) if TOKEN.exists() else None
    if creds and creds.valid:
        return creds
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    else:
        flow = InstalledAppFlow.from_client_secrets_file(str(client_path), SCOPES)
        creds = flow.run_local_server(
            host="127.0.0.1", port=0, open_browser=True,
            access_type="offline", prompt="consent",
            success_message="Morrow Wish YouTube upload authorization completed. You may close this tab.",
        )
    save_json(TOKEN, json.loads(creds.to_json()))
    return creds


def get_manifest():
    req = urllib.request.Request(MANIFEST, headers={"Cache-Control": "no-cache", "User-Agent": "MorrowWish-Owner-YouTubeUpload/1.0"})
    with urllib.request.urlopen(req, timeout=30) as response:
        manifest = json.load(response)
    entries = {x.get("slug"): x for x in manifest.get("trailers", [])}
    if len(entries) != 7 or set(entries) != {x[0] for x in ORDER}:
        raise RuntimeError("Live /promo/review/ manifest does not have exactly the expected seven games.")
    for slug, _, _ in ORDER:
        video = entries[slug].get("video", "")
        if not isinstance(video, str) or not video.startswith("/promo/") or not video.endswith(".mp4") or "hook-v3" in video:
            raise RuntimeError("Missing or obsolete review-page MP4 for: " + slug)
        if entries[slug].get("paused"):
            raise RuntimeError("Review page has paused promo for: " + slug)
    return manifest, entries


def actual_channel(youtube):
    items = youtube.channels().list(part="id,snippet,contentDetails", mine=True).execute().get("items", [])
    if len(items) != 1 or items[0]["id"] != CHANNEL:
        ids = ", ".join(x.get("id", "") for x in items)
        raise RuntimeError("Authenticated YouTube channel is not @morrowwishgames. Found: " + (ids or "none"))
    return items[0]


def existing_titles(youtube, uploads_playlist):
    # Includes private and scheduled uploads, unlike public channel search.
    found = {}
    page = None
    for _ in range(5):
        result = youtube.playlistItems().list(part="snippet", playlistId=uploads_playlist,
                                             maxResults=50, pageToken=page).execute()
        for item in result.get("items", []):
            snippet = item.get("snippet", {})
            title = snippet.get("title", "")
            video_id = snippet.get("resourceId", {}).get("videoId")
            when = snippet.get("publishedAt", "")
            if video_id and when >= "2026-11-22":
                found.setdefault(title, video_id)
        page = result.get("nextPageToken")
        if not page:
            break
    return found


def download_trailer(relative_url, path: Path):
    uri = urllib.parse.urljoin(HOST, relative_url)
    if not uri.startswith(HOST + "/promo/"):
        raise RuntimeError("Refusing unexpected trailer origin: " + uri)
    req = urllib.request.Request(uri, headers={"User-Agent": "MorrowWish-Owner-YouTubeUpload/1.0"})
    with urllib.request.urlopen(req, timeout=120) as response:
        if response.status != 200:
            raise RuntimeError("Trailer unavailable: " + uri)
        with path.open("wb") as f:
            while block := response.read(1024 * 1024):
                f.write(block)
    if path.stat().st_size < 100_000 or path.stat().st_size > 150_000_000:
        raise RuntimeError("Trailer has unexpected length: " + uri)
    with path.open("rb") as f:
        sig = f.read(24)
    if b"ftyp" not in sig:
        raise RuntimeError("Source is not an MP4: " + uri)


def upload(youtube, media_file, title, description, when):
    now = dt.datetime.now(dt.timezone.utc)
    status = {"privacyStatus": "public", "selfDeclaredMadeForKids": False}
    if when > now + dt.timedelta(minutes=3):
        status = {
            "privacyStatus": "private",
            "publishAt": when.isoformat().replace("+00:00", "Z"),
            "selfDeclaredMadeForKids": False,
        }
    request = youtube.videos().insert(
        part="snippet,status",
        body={
            "snippet": {
                "title": title,
                "description": description,
                "categoryId": "20",
                "defaultLanguage": "en",
                "tags": ["Morrow Wish", "IndieGame", "BrowserGame", "Shorts"],
            },
            "status": status,
        },
        media_body=MediaFileUpload(str(media_file), chunksize=8 * 1024 * 1024,
                                   mimetype="video/mp4", resumable=True),
    )
    response = None
    retries = 0
    while response is None:
        try:
            progress, response = request.next_chunk()
            if progress:
                print(f"  Uploading: {progress.progress():.0%}", flush=True)
            retries = 0
        except (HttpError, OSError) as exc:
            retryable = not isinstance(exc, HttpError) or exc.resp.status in (500, 502, 503, 504, 429)
            if not retryable or retries >= 5:
                raise
            retries += 1
            time.sleep(min(2 ** retries, 30))
    if not response.get("id"):
        raise RuntimeError("Upload API did not return a YouTube video ID.")
    return response["id"], status


def main():
    print("Morrow Wish — official YouTube Data API V14 upload")
    manifest, entries = get_manifest()
    print("Live review manifest:", manifest.get("version"), manifest.get("createdAt"))
    creds = get_oauth()
    youtube = build("youtube", "v3", credentials=creds, cache_discovery=False)
    channel = actual_channel(youtube)
    print("Verified upload channel:", channel["snippet"]["title"], channel["id"])
    uploads = channel["contentDetails"]["relatedPlaylists"]["uploads"]
    duplicates = existing_titles(youtube, uploads)
    ledger = read_json(LEDGER)
    with tempfile.TemporaryDirectory(prefix="morrowwish-youtube-") as folder:
        for i, (slug, title, body) in enumerate(ORDER):
            when = FIRST_SLOT_UTC + dt.timedelta(minutes=5 * i)
            prev = ledger.get(slug)
            if prev and prev.get("video") == entries[slug]["video"] and prev.get("id"):
                print("Already uploaded (saved ledger), skipping:", slug, prev["id"])
                continue
            if title in duplicates:
                print("Already on channel (recent upload), skipping:", slug, duplicates[title])
                ledger[slug] = {"id": duplicates[title], "video": entries[slug]["video"],
                                "title": title, "source": "existing-channel"}
                save_json(LEDGER, ledger)
                continue
            description = body + "\n\nPlay free — find the game on our channel profile!\n#Shorts"
            media_file = Path(folder) / (slug + ".mp4")
            print(f"Uploading {slug} from {HOST + entries[slug]['video']}...", flush=True)
            download_trailer(entries[slug]["video"], media_file)
            video_id, status = upload(youtube, media_file, title, description, when)
            actual = youtube.videos().list(part="snippet,status", id=video_id).execute().get("items", [])
            if not actual or actual[0]["snippet"].get("channelId") != CHANNEL:
                raise RuntimeError("Video uploaded but cannot verify intended channel: " + video_id)
            published_status = actual[0]["status"].get("privacyStatus")
            url = "https://www.youtube.com/shorts/" + video_id
            ledger[slug] = {
                "id": video_id, "url": url, "title": title, "video": entries[slug]["video"],
                "intendedTimeUtc": when.isoformat(),
                "requestedStatus": status,
                "actualPrivacy": published_status,
                "uploadedAtUtc": dt.datetime.now(dt.timezone.utc).isoformat(),
            }
            save_json(LEDGER, ledger)
            print("CREATED:", slug, url, "current visibility:", published_status, flush=True)
    print("Finished. Video IDs:", str(LEDGER))


if __name__ == "__main__":
    main()
