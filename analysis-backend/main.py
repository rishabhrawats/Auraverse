from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
import shutil
import json
import cv2
import numpy as np
import math

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

def compute_session_summary(frame_data):
    if not frame_data:
        return {
            "session_duration": "30s",
            "avg_stress": 0,
            "stress_peaks": 0,
            "emotional_valence_balance": 0,
            "engagement_score": 0,
            "emotional_variability": "Low",
            "concealed_emotion_index": 0,
            "dominant_emotion": "Unknown",
        }

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

    return {
        "session_duration": "30s",
        "avg_stress": round(avg_stress, 3),
        "stress_peaks": stress_peaks,
        "emotional_valence_balance": round(valence_balance, 3),
        "engagement_score": round(engagement_score, 3),
        "emotional_variability": variability_label,
        "concealed_emotion_index": round(concealed_index, 3),
        "dominant_emotion": dominant_emotion,
    }

# --------------------------------------------------
# HUMAN-READABLE REPORT GENERATOR
# --------------------------------------------------

def generate_human_report(summary):
    report = []

    stress = summary["avg_stress"]
    engagement = summary["engagement_score"]
    valence = summary["emotional_valence_balance"]
    variability = summary["emotional_variability"]

    # Emotional overview
    if stress < 0.4:
        report.append("Your emotional state appeared calm and composed.")
    elif stress < 0.7:
        report.append("You experienced moderate stress, likely situational rather than overwhelming.")
    else:
        report.append("Elevated stress levels suggest emotional strain or pressure.")

    # Engagement
    if engagement > 0.6:
        report.append("You remained mentally engaged and attentive throughout the session.")
    else:
        report.append("Your engagement fluctuated, which may indicate distraction or fatigue.")

    # Emotional balance
    if valence > 0.15:
        report.append("Positive emotions outweighed negative ones during this session.")
    elif valence < -0.15:
        report.append("Negative emotions were more prominent than positive ones.")
    else:
        report.append("Your emotional tone remained balanced and neutral.")

    # Variability
    if variability == "Low":
        report.append("Your emotional expression was stable and consistent.")
    elif variability == "Medium":
        report.append("Some emotional shifts were present, but within a healthy range.")
    else:
        report.append("Frequent emotional shifts suggest internal processing or uncertainty.")

    # Reflection
    report.append(
        "Consider reflecting on any emotions you noticed but did not fully express."
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

    with open(video_path, "wb") as buffer:
        shutil.copyfileobj(video.file, buffer)

    frames = extract_frames(video_path)
    frame_emotions = analyze_frames(frames)

    with open(os.path.join(session_dir, "frame_emotions.json"), "w") as f:
        json.dump(frame_emotions, f, indent=2)

    session_summary = compute_session_summary(frame_emotions)

    with open(os.path.join(session_dir, "session_summary.json"), "w") as f:
        json.dump(session_summary, f, indent=2)

    human_report = generate_human_report(session_summary)

    with open(os.path.join(session_dir, "human_report.json"), "w") as f:
        json.dump(human_report, f, indent=2)

    return {
        "status": "completed",
        "session_id": session_id,
        "frames_analyzed": len(frame_emotions),
        "session_summary": session_summary,
        "human_report": human_report,
    }
