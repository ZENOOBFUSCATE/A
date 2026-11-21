"""Recap MM local web server. Requires ffprobe and API keys in .env."""
from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
import time
import uuid
from pathlib import Path

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_file

load_dotenv()
WEB_DIR = Path(__file__).resolve().parents[1] / "web"
app = Flask(__name__, static_folder=str(WEB_DIR), static_url_path="")
app.config["MAX_CONTENT_LENGTH"] = int(os.getenv("MAX_UPLOAD_GB", "4")) * 1024**3
OUTPUT_DIR = Path(tempfile.gettempdir()) / "recap-mm-outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
MAX_SECONDS = 30 * 60


@app.after_request
def add_cors_headers(response):
    allowed = {origin.strip().rstrip("/") for origin in os.getenv("FRONTEND_ORIGINS", "").split(",") if origin.strip()}
    origin = request.headers.get("Origin", "").rstrip("/")
    if origin in allowed:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


def api_error(response: requests.Response) -> RuntimeError:
    try:
        detail = response.json().get("detail") or response.json().get("error")
    except Exception:
        detail = response.text[:500]
    return RuntimeError(f"Provider API returned {response.status_code}: {detail}")


def probe_duration(path: Path) -> float:
    binary = shutil.which("ffprobe")
    if not binary:
        raise RuntimeError("ffprobe မတွေ့ပါ။ FFmpeg ကို install လုပ်ပြီး PATH ထဲထည့်ပါ။")
    result = subprocess.run(
        [binary, "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        capture_output=True, text=True, timeout=60,
    )
    if result.returncode:
        raise RuntimeError("ဖိုင်ကိုဖတ်မရပါ။ ဗီဒီယိုဖိုင် မှန်ကန်မှုကို စစ်ဆေးပါ။")
    try:
        return float(result.stdout.strip())
    except ValueError as exc:
        raise RuntimeError("ဗီဒီယိုကြာချိန်ကို ဖတ်မရပါ။") from exc


def transcribe(video_path: Path, filename: str) -> dict:
    key = os.getenv("ELEVENLABS_API_KEY", "").strip()
    if not key:
        raise RuntimeError("ELEVENLABS_API_KEY ကို .env ထဲတွင်ထည့်ပါ။")
    with video_path.open("rb") as stream:
        response = requests.post(
            "https://api.elevenlabs.io/v1/speech-to-text",
            headers={"xi-api-key": key},
            data={"model_id": os.getenv("ELEVENLABS_STT_MODEL", "scribe_v2"), "diarize": "true", "tag_audio_events": "false", "timestamps_granularity": "word"},
            files={"file": (Path(filename).name, stream)}, timeout=(30, 3600),
        )
    if not response.ok:
        raise api_error(response)
    return response.json()


def word_transcript(result: dict) -> str:
    words = result.get("words") or []
    if not words:
        return (result.get("text") or "").strip()
    lines, active, text = [], None, []
    start = None
    for word in words:
        speaker = word.get("speaker_id") or "speaker"
        if active is not None and speaker != active:
            lines.append(f"[{int(start or 0)//60:02d}:{int(start or 0)%60:02d}] {active}: {''.join(text).strip()}")
            text = []
        if active != speaker:
            active, start = speaker, word.get("start", 0)
        text.append(word.get("text", ""))
    if text:
        lines.append(f"[{int(start or 0)//60:02d}:{int(start or 0)%60:02d}] {active}: {''.join(text).strip()}")
    return "\n".join(lines)


def openai_response(prompt: str) -> str:
    key = os.getenv("OPENAI_API_KEY", "").strip()
    if not key:
        raise RuntimeError("OPENAI_API_KEY ကို .env ထဲတွင်ထည့်ပါ။")
    response = requests.post(
        "https://api.openai.com/v1/responses",
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json={"model": os.getenv("OPENAI_MODEL", "gpt-4.1-mini"), "input": prompt},
        timeout=(30, 300),
    )
    if not response.ok:
        raise api_error(response)
    data = response.json()
    output = data.get("output_text")
    if output:
        return output.strip()
    chunks = [part.get("text", "") for item in data.get("output", []) for part in item.get("content", []) if part.get("type") == "output_text"]
    text = "\n".join(chunks).strip()
    if not text:
        raise RuntimeError("AI ထံမှ recap စာသားမရပါ။")
    return text


def make_script(transcript: str, minutes: int) -> str:
    # Summarize large transcripts in pieces before writing the final narration.
    segments = [transcript[i:i + 14000] for i in range(0, len(transcript), 14000)] or [transcript]
    notes = []
    for segment in segments:
        notes.append(openai_response(
            "Summarize this video transcript's key facts, events, arguments and conclusions. "
            "Keep names and numbers accurate. Do not invent details. Write concise notes in English.\n\n" + segment
        ))
    material = "\n\n".join(notes)
    return openai_response(
        f"Write a natural spoken Burmese (Myanmar) recap script for a {minutes}-minute narration. "
        "Use fluent, clear Burmese in Unicode. Cover the most important points in a logical order, "
        "preserve names and facts, avoid repetition and do not add claims absent from the source. "
        "Return only the narration script, without title, markdown or stage directions.\n\n" + material
    )


def clone_voice(sample_path: Path) -> str:
    key = os.getenv("ELEVENLABS_API_KEY", "").strip()
    with sample_path.open("rb") as sample:
        response = requests.post(
            "https://api.elevenlabs.io/v1/voices/add",
            headers={"xi-api-key": key},
            data={"name": f"Recap MM voice {uuid.uuid4().hex[:8]}", "description": "User-authorized voice clone for Burmese recap narration"},
            files={"files": (sample_path.name, sample)}, timeout=(30, 300),
        )
    if not response.ok:
        raise api_error(response)
    voice_id = response.json().get("voice_id")
    if not voice_id:
        raise RuntimeError("Voice clone ဖန်တီးမရပါ။")
    return voice_id


def split_text(text: str, limit: int = 1800) -> list[str]:
    chunks, current = [], ""
    for paragraph in text.splitlines():
        if len(current) + len(paragraph) + 1 <= limit:
            current += ("\n" if current else "") + paragraph
            continue
        if current:
            chunks.append(current)
            current = ""
        while len(paragraph) > limit:
            cut = paragraph.rfind("။", 0, limit)
            if cut < limit // 2:
                cut = paragraph.rfind(" ", 0, limit)
            cut = cut if cut >= limit // 2 else limit
            chunks.append(paragraph[:cut + 1].strip())
            paragraph = paragraph[cut + 1:].strip()
        current = paragraph
    if current.strip():
        chunks.append(current.strip())
    return [part for part in chunks if part]


def synthesize(script: str, voice_id: str, out_path: Path) -> None:
    key = os.getenv("ELEVENLABS_API_KEY", "").strip()
    model = os.getenv("ELEVENLABS_TTS_MODEL", "eleven_v3")
    parts = split_text(script)
    with tempfile.TemporaryDirectory(prefix="recap-mm-tts-") as temp:
        folder = Path(temp)
        for index, text in enumerate(parts):
            response = requests.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                params={"output_format": "mp3_44100_128"},
                headers={"xi-api-key": key, "Content-Type": "application/json"},
                json={"text": text, "model_id": model}, timeout=(30, 300),
            )
            if not response.ok:
                raise api_error(response)
            (folder / f"part-{index:04d}.mp3").write_bytes(response.content)
        list_file = folder / "parts.txt"
        list_file.write_text("".join(f"file '{(folder / f'part-{i:04d}.mp3').as_posix()}'\n" for i in range(len(parts))), encoding="utf-8")
        binary = shutil.which("ffmpeg")
        if not binary:
            raise RuntimeError("ffmpeg မတွေ့ပါ။ FFmpeg ကို install လုပ်ပြီး PATH ထဲထည့်ပါ။")
        result = subprocess.run([binary, "-v", "error", "-f", "concat", "-safe", "0", "-i", str(list_file), "-c", "copy", str(out_path)], capture_output=True, text=True, timeout=300)
        if result.returncode:
            raise RuntimeError("အသံဖိုင်များကို ပေါင်းစည်းရာတွင် မအောင်မြင်ပါ။")


@app.get("/")
def home():
    return app.send_static_file("index.html")


@app.post("/api/recap")
def recap():
    video = request.files.get("video")
    if not video or not video.filename:
        return jsonify(error="ဗီဒီယိုဖိုင်ကို ရွေးချယ်ပါ။"), 400
    try:
        minutes = max(1, min(10, int(request.form.get("minutes", "3"))))
        clone = request.form.get("clone_voice") == "true"
        consent = request.form.get("consent") == "true"
        sample = request.files.get("voice_sample")
        if clone and (not consent or not sample or not sample.filename):
            return jsonify(error="အသံ clone အတွက် ခွင့်ပြုချက်နှင့် အသံနမူနာလိုအပ်သည်။"), 400
        with tempfile.TemporaryDirectory(prefix="recap-mm-upload-") as temp:
            video_path = Path(temp) / Path(video.filename).name
            video.save(video_path)
            duration = probe_duration(video_path)
            if duration <= 0 or duration > MAX_SECONDS:
                return jsonify(error="ဗီဒီယိုကြာချိန်သည် 30 မိနစ်ထက် မကျော်ရပါ။"), 400
            stt = transcribe(video_path, video.filename)
            transcript = word_transcript(stt)
            if not transcript:
                raise RuntimeError("ဗီဒီယိုထဲမှ စကားပြောသံ မတွေ့ပါ။")
            script = make_script(transcript, minutes)
            if clone:
                sample_path = Path(temp) / Path(sample.filename).name
                sample.save(sample_path)
                if sample_path.stat().st_size > 100 * 1024 * 1024:
                    return jsonify(error="အသံနမူနာဖိုင် 100MB ထက်ငယ်ရပါမည်။"), 400
                voice_id = clone_voice(sample_path)
            else:
                voice_id = (request.form.get("voice_id") or os.getenv("ELEVENLABS_VOICE_ID", "")).strip()
                if not voice_id:
                    return jsonify(error="Voice ID ကိုထည့်ပါ၊ သို့မဟုတ် .env ထဲတွင် ELEVENLABS_VOICE_ID သတ်မှတ်ပါ။"), 400
            output_id = uuid.uuid4().hex
            output_path = OUTPUT_DIR / f"{output_id}.mp3"
            synthesize(script, voice_id, output_path)
        # Remove generated files after one day to limit local retention.
        now = time.time()
        for old_file in OUTPUT_DIR.glob("*.mp3"):
            try:
                if now - old_file.stat().st_mtime > 86400:
                    old_file.unlink()
            except OSError:
                pass
        return jsonify(summary=script, transcript=transcript, audio_url=f"/downloads/{output_id}.mp3", filename="recap-mm.mp3")
    except requests.Timeout:
        return jsonify(error="ဝန်ဆောင်မှုတုံ့ပြန်ချိန်ကျော်သွားသည်။ ပြန်ကြိုးစားပါ။"), 504
    except (RuntimeError, ValueError) as exc:
        return jsonify(error=str(exc)), 400
    except Exception:
        app.logger.exception("recap request failed")
        return jsonify(error="Recap ဖန်တီးရာတွင် မမျှော်လင့်ထားသော ပြဿနာဖြစ်သည်။ Server log ကိုစစ်ဆေးပါ။"), 500


@app.get("/downloads/<name>")
def download(name: str):
    if not name.endswith(".mp3") or not name[:-4].isalnum():
        return jsonify(error="ဖိုင်မတွေ့ပါ။"), 404
    path = OUTPUT_DIR / name
    if not path.is_file():
        return jsonify(error="ဖိုင်သက်တမ်းကုန်သွားပါပြီ။ Recap ကို ပြန်လုပ်ပါ။"), 404
    return send_file(path, mimetype="audio/mpeg", as_attachment=False, download_name="recap-mm.mp3")


@app.errorhandler(413)
def too_large(_error):
    return jsonify(error="Upload ဖိုင်သည် server သတ်မှတ်ထားသော အရွယ်အစားထက် ကြီးနေသည်။"), 413


if __name__ == "__main__":
    app.run(host=os.getenv("HOST", "127.0.0.1"), port=int(os.getenv("PORT", "5000")), debug=False)
