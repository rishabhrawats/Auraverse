from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import uuid
import shutil
import json
import cv2
import numpy as np
import math
import subprocess
import wave
from fpdf import FPDF

# --------------------------------------------------
# APP INIT + CORS
# --------------------------------------------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",
        "http://127.0.0.1:5000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = "uploads"
os.makedirs(BASE_DIR, exist_ok=True)

# --------------------------------------------------
# UTIL — JSON SAFE FLOAT
# --------------------------------------------------

def safe_float(value, default=0.0):
    try:
        if value is None or math.isnan(value) or math.isinf(value):
            return default
        return float(value)
    except Exception:
        return default

# --------------------------------------------------
# FRAME EXTRACTION
# --------------------------------------------------

def extract_frames(video_path: str, fps: int = 5):
    cap = cv2.VideoCapture(video_path)
    frames = []

    video_fps = cap.get(cv2.CAP_PROP_FPS) or 30
    interval = max(int(video_fps / fps), 1)

    count = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if count % interval == 0:
            frames.append(frame)

        count += 1

    cap.release()
    return frames

# --------------------------------------------------
# AUDIO EXTRACTION (NEW — SAFE)
# --------------------------------------------------

def extract_audio(video_path: str, audio_path: str):
    """
    Extract mono 16kHz WAV audio from video using ffmpeg
    """
    command = [
        "ffmpeg",
        "-y",
        "-i", video_path,
        "-ac", "1",
        "-ar", "16000",
        audio_path
    ]

    subprocess.run(
        command,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=True
    )

# --------------------------------------------------
# AUDIO ANALYSIS (BASIC, FAST)
# --------------------------------------------------

def _wav_to_float_mono(audio_path: str):
    with wave.open(audio_path, "rb") as wf:
        channels = wf.getnchannels()
        sample_rate = wf.getframerate()
        sample_width = wf.getsampwidth()
        frames = wf.getnframes()
        raw = wf.readframes(frames)

    if sample_width == 1:
        dtype = np.uint8
        data = np.frombuffer(raw, dtype=dtype).astype(np.float32)
        data = (data - 128.0) / 128.0
    elif sample_width == 2:
        dtype = np.int16
        data = np.frombuffer(raw, dtype=dtype).astype(np.float32)
        data = data / 32768.0
    elif sample_width == 4:
        dtype = np.int32
        data = np.frombuffer(raw, dtype=dtype).astype(np.float32)
        data = data / 2147483648.0
    else:
        raise ValueError("Unsupported WAV sample width")

    if channels > 1:
        data = data.reshape(-1, channels).mean(axis=1)

    return data, sample_rate


def _estimate_pitch_hz(frame, sr, min_f0=75, max_f0=400):
    if frame.size == 0:
        return None
    frame = frame - np.mean(frame)
    if np.allclose(frame, 0):
        return None
    window = np.hanning(frame.size)
    frame = frame * window
    corr = np.correlate(frame, frame, mode="full")
    corr = corr[corr.size // 2:]

    min_lag = int(sr / max_f0)
    max_lag = int(sr / min_f0)
    if max_lag <= min_lag or max_lag >= corr.size:
        return None

    segment = corr[min_lag:max_lag]
    peak_idx = int(np.argmax(segment)) + min_lag
    if corr[peak_idx] <= 0:
        return None
    return sr / peak_idx


def analyze_audio(audio_path: str):
    try:
        samples, sr = _wav_to_float_mono(audio_path)
        if samples.size == 0:
            return None

        duration = samples.size / float(sr)
        rms = float(np.sqrt(np.mean(samples ** 2)))
        peak = float(np.max(np.abs(samples)))
        energy_db = 20.0 * np.log10(rms + 1e-9)

        sign_changes = np.diff(np.sign(samples))
        zcr = float(np.mean(sign_changes != 0))

        silence_thresh = max(0.02, 0.1 * rms)
        silence_ratio = float(np.mean(np.abs(samples) < silence_thresh))
        speech_ratio = float(1.0 - silence_ratio)

        frame_len = int(0.03 * sr)
        if frame_len <= 0:
            frame_len = 480
        frame_count = int(len(samples) / frame_len)
        if frame_count == 0:
            return None

        frames = samples[: frame_count * frame_len].reshape(frame_count, frame_len)
        frame_rms = np.sqrt(np.mean(frames ** 2, axis=1))
        voiced = frame_rms > silence_thresh

        pitch_values = []
        for idx, is_voiced in enumerate(voiced):
            if not is_voiced:
                continue
            pitch = _estimate_pitch_hz(frames[idx], sr)
            if pitch is not None:
                pitch_values.append(pitch)

        pitch_mean = float(np.mean(pitch_values)) if pitch_values else 0.0
        pitch_std = float(np.std(pitch_values)) if pitch_values else 0.0
        pitch_min = float(np.min(pitch_values)) if pitch_values else 0.0
        pitch_max = float(np.max(pitch_values)) if pitch_values else 0.0
        pitch_range = pitch_max - pitch_min

        bursts = 0
        burst_lengths = []
        current = 0
        for v in voiced:
            if v:
                current += 1
            else:
                if current > 0:
                    bursts += 1
                    burst_lengths.append(current)
                    current = 0
        if current > 0:
            bursts += 1
            burst_lengths.append(current)

        avg_burst_sec = float(np.mean(burst_lengths) * 0.03) if burst_lengths else 0.0
        burst_rate_per_min = float((bursts / duration) * 60.0) if duration > 0 else 0.0

        energy_norm = float(np.clip((energy_db + 40.0) / 20.0, 0.0, 1.0))
        zcr_norm = float(np.clip(zcr / 0.15, 0.0, 1.0))
        pitch_var_norm = float(np.clip(pitch_std / 80.0, 0.0, 1.0))
        stress_proxy = float(np.mean([energy_norm, zcr_norm, pitch_var_norm]))

        return {
            "duration_sec": round(duration, 2),
            "rms": round(rms, 4),
            "peak": round(peak, 4),
            "energy_db": round(energy_db, 2),
            "zcr": round(zcr, 4),
            "silence_ratio": round(silence_ratio, 3),
            "speech_ratio": round(speech_ratio, 3),
            "speech_bursts": bursts,
            "avg_burst_sec": round(avg_burst_sec, 2),
            "burst_rate_per_min": round(burst_rate_per_min, 2),
            "pitch_mean_hz": round(pitch_mean, 1),
            "pitch_std_hz": round(pitch_std, 1),
            "pitch_range_hz": round(pitch_range, 1),
            "stress_proxy": round(stress_proxy, 3),
            "sample_rate": sr,
        }
    except Exception:
        return None

# --------------------------------------------------
# MOCK FRAME-LEVEL ANALYSIS (STABLE)
# --------------------------------------------------

def analyze_frames(frames):
    results = []

    for i in range(len(frames)):
        stress = np.clip(np.random.normal(0.6, 0.12), 0, 1)
        positive = np.clip(np.random.normal(0.3, 0.1), 0, 1)
        negative = np.clip(np.random.normal(0.35, 0.1), 0, 1)
        engagement = np.clip(np.random.normal(0.65, 0.1), 0, 1)

        results.append({
            "frame_index": i,
            "stress": round(safe_float(stress), 3),
            "positive_affect": round(safe_float(positive), 3),
            "negative_affect": round(safe_float(negative), 3),
            "engagement": round(safe_float(engagement), 3),
        })

    return results

# --------------------------------------------------
# SESSION-LEVEL METRICS
# --------------------------------------------------

def compute_session_summary(frame_data, audio_summary=None):
    if not frame_data:
        base = {
            "session_duration": "90s",
            "avg_stress": 0,
            "stress_peaks": 0,
            "emotional_valence_balance": 0,
            "engagement_score": 0,
            "emotional_variability": "Low",
            "concealed_emotion_index": 0,
            "dominant_emotion": "Unknown",
        }
        if audio_summary:
            base["overall_score"] = 0
            base["audio_stress_proxy"] = audio_summary.get("stress_proxy", 0)
        return base

    stress = np.array([f["stress"] for f in frame_data])
    pos = np.array([f["positive_affect"] for f in frame_data])
    neg = np.array([f["negative_affect"] for f in frame_data])
    eng = np.array([f["engagement"] for f in frame_data])

    avg_stress = safe_float(np.mean(stress))
    stress_peaks = int(np.sum(stress > 0.7))
    valence_balance = safe_float(np.mean(pos - neg))
    engagement_score = safe_float(np.mean(eng))
    variability_raw = safe_float(np.std(stress + pos + neg))

    if variability_raw < 0.15:
        variability_label = "Low"
    elif variability_raw < 0.3:
        variability_label = "Medium"
    else:
        variability_label = "High"

    concealed_candidates = [
        s for s, p, n in zip(stress, pos, neg)
        if s > 0.6 and p < 0.2 and n < 0.2
    ]

    concealed_index = safe_float(
        np.mean(concealed_candidates) if concealed_candidates else 0
    )

    if avg_stress > 0.6:
        dominant_emotion = "Stress / Anxiety"
    elif valence_balance < -0.2:
        dominant_emotion = "Sadness / Frustration"
    elif valence_balance > 0.2:
        dominant_emotion = "Positive / Relief"
    else:
        dominant_emotion = "Neutral / Mixed"

    summary = {
        "session_duration": "90s",
        "avg_stress": round(avg_stress, 3),
        "stress_peaks": stress_peaks,
        "emotional_valence_balance": round(valence_balance, 3),
        "engagement_score": round(engagement_score, 3),
        "emotional_variability": variability_label,
        "concealed_emotion_index": round(concealed_index, 3),
        "dominant_emotion": dominant_emotion,
    }

    if audio_summary:
        valence_norm = float(np.clip((valence_balance + 1.0) / 2.0, 0.0, 1.0))
        video_calm = float(np.clip(1.0 - avg_stress, 0.0, 1.0))
        video_score = 0.4 * video_calm + 0.3 * valence_norm + 0.3 * engagement_score

        audio_stress_proxy = float(audio_summary.get("stress_proxy", 0))
        audio_calm = float(np.clip(1.0 - audio_stress_proxy, 0.0, 1.0))
        audio_flow = float(np.clip(audio_summary.get("speech_ratio", 0), 0.0, 1.0))
        audio_score = 0.6 * audio_calm + 0.4 * audio_flow

        overall_score = 0.6 * video_score + 0.4 * audio_score
        summary["overall_score"] = round(overall_score, 3)
        summary["audio_stress_proxy"] = round(audio_stress_proxy, 3)

    return summary

# --------------------------------------------------
# HUMAN-READABLE REPORT
# --------------------------------------------------

def generate_human_report(summary, audio_summary=None):
    report = []

    stress = summary["avg_stress"]
    engagement = summary["engagement_score"]
    valence = summary["emotional_valence_balance"]
    variability = summary["emotional_variability"]
    overall = summary.get("overall_score")

    if overall is not None:
        if overall >= 0.7:
            opener = "Overall, you showed a strong, steady foundation to build on."
        elif overall >= 0.45:
            opener = "Overall, you showed a mix of signals that looks workable with small adjustments."
        else:
            opener = "Overall, this session suggests you're carrying some strain right now."
        report.append(opener)

    if stress < 0.4:
        report.append("Your stress level looked low. Keep reinforcing the habits that help you stay centered.")
    elif stress < 0.7:
        report.append("Stress appeared moderate. Consider one small reset today to ease the pressure.")
    else:
        report.append("Stress was elevated. A short pause or breathing exercise could help you recover balance.")

    if engagement > 0.6:
        report.append("Your attention stayed steady. That focus is a strength you can leverage.")
    else:
        report.append("Your focus fluctuated at times. Try shortening tasks into smaller, easy wins.")

    if valence > 0.15:
        report.append("Positive emotions were slightly stronger. Build on that by naming one win from today.")
    elif valence < -0.15:
        report.append("Negative emotions were more prominent. Consider a quick check-in: what would feel lighter right now?")
    else:
        report.append("Your emotional tone stayed balanced. Keep a simple routine to maintain that stability.")

    if variability == "Low":
        report.append("You were emotionally consistent. That steadiness can help you make clear decisions.")
    elif variability == "Medium":
        report.append("There were a few shifts, which is normal. Notice what triggered those changes.")
    else:
        report.append("There were frequent shifts, suggesting active processing. A short journal note could help clarify patterns.")

    if audio_summary:
        energy_db = audio_summary.get("energy_db", -60)
        speech_ratio = audio_summary.get("speech_ratio", 0)
        zcr = audio_summary.get("zcr", 0)
        pitch_std = audio_summary.get("pitch_std_hz", 0)
        burst_rate = audio_summary.get("burst_rate_per_min", 0)

        if speech_ratio < 0.35:
            report.append("Your speech had longer pauses. Use that reflective pace to choose your words with intention.")
        elif speech_ratio > 0.75:
            report.append("Your speech flowed smoothly. That's a good sign of clarity and momentum.")

        if energy_db < -35:
            report.append("Your vocal energy was soft. If you want more confidence, try adding slightly stronger emphasis.")
        elif energy_db > -20:
            report.append("Your vocal energy was strong. Channel it into a clear, simple next step.")

        if zcr > 0.12:
            report.append("Your articulation was sharp, which can show urgency. Slow one beat between phrases to reduce tension.")

        if pitch_std > 60:
            report.append("Your pitch varied a lot, which can signal intensity. Try a slower pace for steadier delivery.")
        elif pitch_std > 0:
            report.append("Your pitch stayed steady, indicating controlled delivery. Keep that consistency.")

        if burst_rate > 30:
            report.append("Your pacing was fast. A brief pause after key points can improve clarity.")
        elif burst_rate > 0 and burst_rate < 10:
            report.append("Your pacing was slower. If you want more energy, shorten the gaps slightly.")

    report.append(
        "This reflection is not a diagnosis. Use it as a coaching tool for self-awareness, not medical advice."
    )

    return report

# --------------------------------------------------
# API ENDPOINT
# --------------------------------------------------

@app.post("/api/session/upload")
async def upload_session_video(video: UploadFile = File(...)):
    session_id = str(uuid.uuid4())
    session_dir = os.path.join(BASE_DIR, session_id)
    os.makedirs(session_dir, exist_ok=True)

    video_path = os.path.join(session_dir, "session.webm")
    audio_path = os.path.join(session_dir, "audio.wav")

    # Save video
    with open(video_path, "wb") as buffer:
        shutil.copyfileobj(video.file, buffer)

    # Extract audio
    audio_status = "not_extracted"
    audio_summary = None
    try:
        extract_audio(video_path, audio_path)
        audio_status = "extracted"
        audio_summary = analyze_audio(audio_path)
    except Exception:
        audio_status = "failed"

    # Visual analysis
    frames = extract_frames(video_path)
    frame_emotions = analyze_frames(frames)

    with open(os.path.join(session_dir, "frame_emotions.json"), "w") as f:
        json.dump(frame_emotions, f, indent=2)

    session_summary = compute_session_summary(frame_emotions, audio_summary)

    with open(os.path.join(session_dir, "session_summary.json"), "w") as f:
        json.dump(session_summary, f, indent=2)

    human_report = generate_human_report(session_summary, audio_summary)

    with open(os.path.join(session_dir, "human_report.json"), "w") as f:
        json.dump(human_report, f, indent=2)

    if audio_summary:
        with open(os.path.join(session_dir, "audio_summary.json"), "w") as f:
            json.dump(audio_summary, f, indent=2)

    report_pdf_path = os.path.join(session_dir, "session_report.pdf")
    try:
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        pdf.set_font("Helvetica", size=16)
        pdf.cell(0, 10, "Session Reflection Report", ln=True)

        pdf.set_font("Helvetica", size=11)
        pdf.ln(2)
        pdf.cell(0, 8, f"Session ID: {session_id}", ln=True)
        pdf.cell(0, 8, f"Duration: {session_summary.get('session_duration', '90s')}", ln=True)
        pdf.ln(2)

        pdf.set_font("Helvetica", size=12)
        pdf.cell(0, 8, "Coaching Summary", ln=True)
        pdf.set_font("Helvetica", size=11)
        for line in human_report:
            pdf.multi_cell(0, 6, f"- {line}")

        pdf.ln(2)
        pdf.set_font("Helvetica", size=12)
        pdf.cell(0, 8, "Session Metrics", ln=True)
        pdf.set_font("Helvetica", size=11)
        for key, value in session_summary.items():
            pdf.cell(0, 6, f"{key}: {value}", ln=True)

        if audio_summary:
            pdf.ln(2)
            pdf.set_font("Helvetica", size=12)
            pdf.cell(0, 8, "Audio Metrics", ln=True)
            pdf.set_font("Helvetica", size=11)
            for key, value in audio_summary.items():
                pdf.cell(0, 6, f"{key}: {value}", ln=True)

        pdf.output(report_pdf_path)
    except Exception:
        report_pdf_path = None

    return {
        "status": "completed",
        "session_id": session_id,
        "audio": audio_status,
        "frames_analyzed": len(frame_emotions),
        "session_summary": session_summary,
        "human_report": human_report,
        "audio_summary": audio_summary,
        "report_pdf_url": f"/api/session/{session_id}/report.pdf" if report_pdf_path else None,
    }


@app.get("/api/session/{session_id}/report.pdf")
async def download_session_report(session_id: str):
    report_path = os.path.join(BASE_DIR, session_id, "session_report.pdf")
    if not os.path.exists(report_path):
        return {"error": "report_not_found"}
    return FileResponse(
        report_path,
        media_type="application/pdf",
        filename=f"session_{session_id}_report.pdf"
    )

