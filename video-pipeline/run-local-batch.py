#!/usr/bin/env python3
"""run-local-batch.py — resumable all-local video pipeline for the bootcamp backlog.

Proven recipe (19 videos done Sep 17-18): yt-dlp mp4 -> ffmpeg mp3 ->
local whisper-small (docker) -> 1 frame/min (cap 80) -> ollama minicpm-v
captions, serial -> combined.md -> narrative via local qwen3:8b (chunked).

Coexistence: every GPU stage (whisper, each caption, each narrative call)
holds the shared fc-pool gpu_lock on valkey :16379 and releases right after,
so the recipe-art ComfyUI batch interleaves instead of colliding. Short holds
only; the lock value is "video-local" with a refresher for the whisper stage.

Idempotent: re-running skips videos whose narrative exists and resumes
partial videos at the first missing artifact. Safe to kill and restart.

Usage:
  python3 run-local-batch.py            # whole local-queue.tsv in order
  LOCAL_QUEUE=name.tsv python3 run-local-batch.py
Env:
  VIDEO_PAUSE_S=120   sleep between videos
  FRAME_CAP=80        max captioned frames per video
  OLLAMA=http://localhost:11434
"""
from __future__ import annotations

import base64
import json
import os
import socket
import subprocess
import sys
import threading
import time
import urllib.request as urlreq
from pathlib import Path

VT = Path.home() / "video-transcripts"
TSB = VT / "typescript-bootcamp"
SIBLING_SCRIPTS = (Path.home() / "code" / "projects"
                   / "goose-cli-video-transcription-recipe" / "scripts")
QUEUE = TSB / os.environ.get("LOCAL_QUEUE", "local-queue.tsv")
WHISPER_IMAGE = "goose-cli-video-transcription-recipe-whisper:latest"
OLLAMA = os.environ.get("OLLAMA", "http://localhost:11434")
VALKEY_HOST, VALKEY_PORT, LOCK = "127.0.0.1", 16379, "gpu_lock"
FRAME_CAP = int(os.environ.get("FRAME_CAP", "80"))
VISION_MODEL = os.environ.get("VISION_MODEL", "minicpm-v")
VIDEO_PAUSE = float(os.environ.get("VIDEO_PAUSE_S", "120"))
CAPTION_PROMPT = (
    "Describe all visual content visible in this frame in detail. "
    "Include people, objects, text overlays, colors, composition, setting, "
    "and any on-screen graphics or titles."
)


def log(*a):
    print(f"[{time.strftime('%H:%M:%S')}]", *a, flush=True)


def _valkey(*args: str) -> str:
    cmd = f"*{len(args)}\r\n" + "".join(f"${len(a)}\r\n{a}\r\n" for a in args)
    s = socket.create_connection((VALKEY_HOST, VALKEY_PORT), timeout=5)
    s.settimeout(10)
    try:
        s.sendall(cmd.encode())
        return s.recv(4096).decode()
    finally:
        s.close()


def gpu_acquire(wait_s: int = 7200) -> None:
    deadline = time.time() + wait_s
    while time.time() < deadline:
        if _valkey("SET", LOCK, "video-local", "NX", "EX", "3600").startswith("+OK"):
            return
        time.sleep(10)
    raise RuntimeError("gpu_lock not acquired")


def gpu_release() -> None:
    try:
        _valkey("DEL", LOCK)
    except OSError:
        pass


class Refresher(threading.Thread):
    """Re-assert the lock during long GPU holds (whisper on long audio)."""

    def __init__(self):
        super().__init__(daemon=True)
        self._stop = threading.Event()

    def run(self):
        while not self._stop.wait(300):
            try:
                _valkey("SET", LOCK, "video-local", "XX", "EX", "3600")
            except OSError:
                pass

    def halt(self):
        self._stop.set()


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def ollama_chat(model, prompt, image_b64=None, num_ctx=8192, timeout=300):
    msg = {"role": "user", "content": prompt}
    if image_b64:
        msg["images"] = [image_b64]
    payload = {"model": model, "messages": [msg], "stream": False,
               "think": False, "keep_alive": "5m",
               "options": {"num_ctx": num_ctx}}
    r = urlreq.Request(OLLAMA + "/api/chat", data=json.dumps(payload).encode(),
                       headers={"Content-Type": "application/json"})
    with urlreq.urlopen(r, timeout=timeout) as resp:
        return json.loads(resp.read())["message"]["content"].strip()


def ollama_gen(model, prompt, num_ctx=8192, timeout=600, keep_alive="5m"):
    payload = {"model": model, "prompt": prompt, "stream": False,
               "think": False, "keep_alive": keep_alive,
               "options": {"num_ctx": num_ctx}}
    r = urlreq.Request(OLLAMA + "/api/generate",
                       data=json.dumps(payload).encode(),
                       headers={"Content-Type": "application/json"})
    with urlreq.urlopen(r, timeout=timeout) as resp:
        return json.loads(resp.read())["response"].strip()


def mmss(s):
    s = int(s)
    return f"{s // 60:02d}:{s % 60:02d}"


def vram_free_gb():
    try:
        out = subprocess.run(["rocm-smi", "--showmeminfo", "vram"],
                             capture_output=True, text=True,
                             timeout=30).stdout
        total = used = 0
        for line in out.splitlines():
            if "Total Memory" in line:
                total = int(line.split()[-1])
            elif "Used Memory" in line:
                used = int(line.split()[-1])
        return (total - used) / 1e9
    except Exception:
        return 99.0


def mp4_valid(p: Path) -> bool:
    try:
        if p.stat().st_size < 1_000_000:
            return False
        r = subprocess.run(
            ["ffmpeg", "-v", "error", "-sseof", "-3", "-i", str(p),
             "-frames:v", "1", "-f", "null", "-"],
            capture_output=True, text=True, timeout=120)
        return r.returncode == 0
    except Exception:
        return False


def mp3_valid(p: Path) -> bool:
    try:
        r = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "csv=p=0", str(p)],
            capture_output=True, text=True, timeout=60)
        return float(r.stdout.strip()) > 0
    except Exception:
        return False


def unload_ollama():
    for m in ("minicpm-v", "qwen3-vl:8b", "qwen3:8b"):
        try:
            ollama_gen(m, "ok", num_ctx=64, timeout=30, keep_alive="0")
        except Exception:
            pass


def comfy_idle(timeout_s=900):
    import urllib.request as _urlreq
    end = time.time() + timeout_s
    while time.time() < end:
        try:
            with _urlreq.urlopen("http://127.0.0.1:8188/queue",
                                 timeout=10) as r:
                q = json.loads(r.read())
            if not q.get("queue_running") and not q.get("queue_pending"):
                return True
        except Exception:
            pass
        time.sleep(15)
    return False


def ollama_resident():
    try:
        out = subprocess.run(["ollama", "ps"], capture_output=True,
                             text=True, timeout=30).stdout
        return [l.split()[0] for l in out.splitlines()[1:] if l.strip()]
    except Exception:
        return []


def wait_for_vram(min_free_gb, timeout_s=900):
    end = time.time() + timeout_s
    while time.time() < end:
        free = vram_free_gb()
        if free >= min_free_gb:
            return True
        log(f"VRAM {free:.1f}GB free < {min_free_gb}GB, waiting 30s")
        time.sleep(30)
    return False


def process_video(vid, url, channel, title):
    d = TSB / f"local-{vid}"
    d.mkdir(exist_ok=True)
    narr = d / f"{vid}-narrative.md"
    if narr.exists():
        log(f"{vid}: narrative exists, skip")
        return True

    mp4 = d / f"{vid}.mp4"
    for use_android, fmt in (
            (True, "best[ext=mp4]/bestvideo[ext=mp4]+bestaudio[ext=m4a]"
                   "/bestvideo+bestaudio/best"),
            (False, "bestvideo+bestaudio/best")):
        if mp4.exists() and mp4_valid(mp4):
            break
        if mp4.exists():
            log(f"{vid}: partial mp4 removed")
            mp4.unlink()
        log(f"{vid}: downloading (fmt {fmt[:40]})")
        args = ["yt-dlp", "--no-playlist",
                "--js-runtimes",
                "node:/home/bryanchasko/.nvm/versions/node/v24.14.0/bin/node",
                "-f", fmt, "--merge-output-format", "mp4",
                "-o", str(mp4), url]
        if use_android:
            args[2:2] = ["--extractor-args",
                         "youtube:player_client=android"]
        r = run(args, timeout=3600)
        if r.returncode != 0 or not mp4.exists():
            log(f"{vid}: DOWNLOAD FAIL {r.stderr[-300:]}")
    if not (mp4.exists() and mp4_valid(mp4)):
        log(f"{vid}: mp4 unusable after retries")
        return False

    mp3 = d / f"{vid}.mp3"
    if mp3.exists() and not mp3_valid(mp3):
        log(f"{vid}: partial/corrupt mp3 removed")
        mp3.unlink()
    if not (mp3.exists() and mp3.stat().st_size > 0):
        s3uri = (f"s3://dekawowow-media-946179428633-us-west-2/"
                 f"typescript-bootcamp-audio/{vid}.mp3")
        env = dict(os.environ,
                   AWS_PROFILE=os.environ.get("AWS_PROFILE",
                                              "bryanchasko-kiro"))
        r = run(["aws", "s3", "cp", s3uri, str(mp3),
                 "--region", "us-west-2"], env=env, timeout=600)
        if r.returncode != 0 or not mp3.exists():
            log(f"{vid}: no S3 audio, extracting from mp4")
            r = run(["ffmpeg", "-y", "-i", str(mp4), "-vn", "-ac", "1",
                     "-ar", "16000", str(mp3)], timeout=3600)
            if r.returncode != 0:
                log(f"{vid}: FFMPEG FAIL {r.stderr[-300:]}")
                return False
        else:
            log(f"{vid}: audio pulled from S3")

    tj = d / f"{vid}.transcript.json"
    if not tj.exists():
        unload_ollama()
        log(f"{vid}: whisper-small (GPU lock held)")
        gpu_acquire()
        ref = Refresher()
        ref.start()
        try:
            if ollama_resident():
                unload_ollama()
                time.sleep(20)
            if ollama_resident() or not comfy_idle(600):
                log(f"{vid}: GPU never idled "
                    f"(ollama={ollama_resident()}), deferring whisper")
                return False
            r = run(["docker", "run", "--rm",
                     "--device", "/dev/kfd", "--device", "/dev/dri",
                     "--group-add", "video", "--group-add", "render",
                     "--user", "1000:1500",
                     "-v", f"{d}:/media",
                     "-e", "HSA_OVERRIDE_GFX_VERSION=10.3.0",
                     "--entrypoint", "",
                     WHISPER_IMAGE, "bash", "-c",
                     f"whisper /media/{vid}.mp3 --model small "
                     f"--output_dir /media --output_format json --verbose False"],
                    timeout=10800)
        finally:
            ref.halt()
            gpu_release()
        raw = d / f"{vid}.json"
        if r.returncode != 0 or not raw.exists():
            log(f"{vid}: GPU whisper failed "
                f"(rc={r.returncode}), CPU-tiny fallback, no lock")
            try:
                rr = subprocess.run(
                    ["ffprobe", "-v", "error", "-show_entries",
                     "format=duration", "-of", "csv=p=0", str(mp3)],
                    capture_output=True, text=True, timeout=60)
                dur = float(rr.stdout.strip())
            except Exception:
                dur = 0
            if dur > 5400:
                log(f"{vid}: audio too long ({dur/60:.0f}min) for CPU, "
                    f"deferring to GPU later")
                return False
            r = run(["docker", "run", "--rm",
                     "--user", "1000:1500",
                     "-v", f"{d}:/media",
                     "--entrypoint", "",
                     WHISPER_IMAGE, "bash", "-c",
                     f"whisper --device cpu --model tiny "
                     f"/media/{vid}.mp3 "
                     f"--output_dir /media --output_format json "
                     f"--verbose False"],
                    timeout=10800)
            if r.returncode != 0 or not raw.exists():
                log(f"{vid}: CPU WHISPER FAIL rc={r.returncode} "
                    f"{r.stderr[-300:]}")
                return False
            log(f"{vid}: CPU-tiny transcript ok (GPU was busy)")
        raw.rename(tj)
    try:
        r = run([sys.executable, str(SIBLING_SCRIPTS / "tighten.py"),
                 "transcript", str(tj)], timeout=300)
        log(f"{vid}: tighten-transcript rc={r.returncode}")
    except Exception as e:
        log(f"{vid}: tighten-transcript skipped: {e}")
    segs = json.loads(tj.read_text()).get("segments", [])
    log(f"{vid}: transcript {len(segs)} segs")

    # frames: 1/min, uniform-subsample to FRAME_CAP
    fdir = d / f"frames-{vid}"
    times_path = d / f"{vid}-frame-times.json"
    if not times_path.exists():
        log(f"{vid}: extracting frames")
        tmp = d / "_frametmp"
        tmp.mkdir(exist_ok=True)
        r = run(["ffmpeg", "-y", "-i", str(mp4), "-vf",
                 "fps=1/60,scale=768:-1", str(tmp / "f_%04d.png")],
                timeout=3600)
        allf = sorted(tmp.glob("f_*.png"))
        if not allf:
            log(f"{vid}: NO FRAMES {r.stderr[-300:]}")
            return False
        step = max(1, len(allf) // FRAME_CAP)
        keep = allf[::step][:FRAME_CAP]
        fdir.mkdir(exist_ok=True)
        times = {}
        for i, src in enumerate(keep, 1):
            name = f"{vid}_frame_{i:04d}.png"
            src.rename(fdir / name)
            times[name] = (int(src.stem.split('_')[1]) - 1) * 60
        for leftover in tmp.glob("*.png"):
            leftover.unlink()
        tmp.rmdir()
        times_path.write_text(json.dumps(times))
    else:
        times = json.loads(times_path.read_text())
    log(f"{vid}: {len(times)} frames")

    # vision: serial minicpm-v captions, lock per frame
    fa = d / f"{vid}-frame-analysis.json"
    caps = []
    if fa.exists():
        try:
            caps = json.loads(fa.read_text())
            if isinstance(caps, dict):
                caps = caps.get("frames", [])
        except Exception:
            caps = []
    have = {c.get("frame") for c in caps if isinstance(c, dict)}
    pending = [f for f in sorted(times) if f not in have]
    log(f"{vid}: vision {len(caps)} cached, {len(pending)} pending")
    for name in pending:
        b64 = base64.b64encode((fdir / name).read_bytes()).decode()
        while True:
            gpu_acquire()
            if comfy_idle(600):
                break
            gpu_release()
            log(f"{vid}: VRAM tight, yielding 60s before {name}")
            time.sleep(60)
        try:
            desc = ollama_chat(VISION_MODEL, CAPTION_PROMPT, b64)
        except Exception as e:
            desc = f"[ERROR: {e}]"
        finally:
            gpu_release()
        caps.append({"frame": name,
                     "frame_index": sorted(times).index(name),
                     "description": desc})
        if len(caps) % 10 == 0:
            fa.write_text(json.dumps(caps))
            log(f"{vid}: captioned {len(caps)}/{len(times)}")
    fa.write_text(json.dumps(caps))

    # combined.md
    comb = d / f"{vid}-combined.md"
    if not comb.exists():
        log(f"{vid}: merging combined.md")
        seglist = [(float(s.get("start", 0)), float(s.get("end", 0)),
                    s.get("text", "").strip()) for s in segs]
        out = [f"# {title} — {channel} ({vid}) - combined vision + transcript",
               f"- source: {url} | {channel} | {title}",
               f"frames captioned: {len(caps)} (model ollama {VISION_MODEL}), "
               f"transcript segments: {len(seglist)}, approx duration "
               f"{mmss(seglist[-1][1]) if seglist else '?'}",
               "", "## frame captions", ""]
        for c in caps:
            t = times[c["frame"]]
            out.append(f"### {c['frame']} (~{mmss(t)})")
            out.append("")
            out.append(c["description"])
            out.append("")
            window = [f"[{mmss(a)}] {tx}" for a, b, tx in seglist
                      if t - 60 <= a <= t + 180]
            if window:
                out.append("**audio:** " + " ".join(window[:12]))
                out.append("")
        comb.write_text("\n".join(out))

    # narrative: chunked local qwen3:8b map-reduce
    if not narr.exists():
        log(f"{vid}: narrative via qwen3:8b (GPU lock per call)")
        unload_ollama()
        texts = [tx for _, _, tx in seglist if tx]
        nch = max(1, min(6, (len(texts) + 199) // 200))
        per = max(1, (len(texts) + nch - 1) // nch)
        briefs = []
        for i in range(0, len(texts), per):
            chunk = " ".join(texts[i:i + per])[:12000]
            while True:
                gpu_acquire()
                if comfy_idle(600):
                    break
                gpu_release()
                log(f"{vid}: VRAM tight, yielding 60s before narrative chunk")
                time.sleep(60)
            try:
                b = ollama_gen(
                    "qwen3:8b",
                    f"Summarize the key technical concepts taught in this "
                    f"transcript chunk (part {len(briefs)+1}). List concepts "
                    f"with one-line explanations. Keep code identifiers "
                    f"verbatim.\n\n{chunk}")
            finally:
                gpu_release()
            briefs.append(b)
        while True:
            gpu_acquire()
            if comfy_idle(600):
                break
            gpu_release()
            log(f"{vid}: VRAM tight, yielding 60s before narrative stitch")
            time.sleep(60)
        try:
            body = ollama_gen(
                "qwen3:8b",
                f"Stitch these section summaries of the video '{title}' by "
                f"{channel} into one narrative markdown doc with a ## Summary "
                f"section and a ## Concepts section (numbered, with short "
                f"typescript code examples where relevant). Plain markdown, "
                f"no preamble.\n\n" + "\n\n".join(briefs)[:20000],
                num_ctx=16384)
        finally:
            gpu_release()
        narr.write_text(
            f"# {title} — {channel} ({vid}) — narrative\n"
            f"**URL**: {url}  \n"
            f"**Duration**: ~{mmss(seglist[-1][1]) if seglist else '?'} | "
            f"**Frames captioned**: {len(caps)} (local {VISION_MODEL}) | "
            f"**Transcript**: local whisper small, {len(seglist)} segs\n"
            + body + "\n")
    try:
        meta_dir = d / "transcripts"
        meta_dir.mkdir(exist_ok=True)
        (meta_dir / "metadata.json").write_text(json.dumps({
            "url": url, "channel": channel, "title": title,
            "video_id": vid,
            "duration": mmss(seglist[-1][1]) if seglist else "?",
            "transcript": str(tj.name),
            "whisper_model": "small-gpu/tiny-cpu",
            "vision_model": VISION_MODEL,
        }, indent=1))
        (d / "status.json").write_text(json.dumps({
            "status": "done",
            "date_transcribed": time.strftime("%Y-%m-%d"),
            "whisper_model": "small-gpu/tiny-cpu",
        }, indent=1))
        route_env = dict(os.environ)
        route_env.setdefault("ROUTE_BACKEND", "s3vectors")
        route_env.setdefault("AWS_PROFILE", "bryanchasko-kiro")
        r = run([sys.executable, str(SIBLING_SCRIPTS / "route-narrative.py"),
                 str(narr), str(d)], timeout=300, env=route_env)
        log(f"{vid}: route-narrative rc={r.returncode} "
            f"{r.stdout.strip().splitlines()[-1] if r.stdout.strip() else ''}")
    except Exception as e:
        log(f"{vid}: route skipped: {e}")
    if narr.exists() and mp4.exists():
        mp4.unlink()
        log(f"{vid}: mp4 removed to reclaim disk (frames+transcript kept)")
    log(f"{vid}: DONE")
    return True


def main():
    rows = [l.strip().split("\t") for l in QUEUE.read_text().splitlines()
            if l.strip()]
    log(f"queue: {len(rows)} videos <- {QUEUE}")
    ok, fail = 0, []
    for parts in rows:
        vid, url = parts[0], parts[1]
        channel, title = (parts[2] if len(parts) > 2 else ""), \
            (parts[3] if len(parts) > 3 else vid)
        try:
            if process_video(vid, url, channel, title):
                ok += 1
            else:
                fail.append(vid)
        except Exception as e:
            log(f"{vid}: ERROR {e}")
            fail.append(vid)
        time.sleep(VIDEO_PAUSE)
    log(f"batch finished: {ok} ok, {len(fail)} failed {fail}")


if __name__ == "__main__":
    main()

