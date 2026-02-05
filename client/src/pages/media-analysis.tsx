import { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Camera, Sparkles, Brain } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

/* ===============================
   CONFIG
================================ */
const RECORDING_DURATION = 90; // 1.5 minutes
const QUESTIONS_PER_SESSION = 3;
const ANALYSIS_URL = import.meta.env.VITE_ANALYSIS_URL || "http://localhost:8000";

/* ===============================
   QUESTION BANK (18)
================================ */
const QUESTION_BANK = [
  "How have you been feeling emotionally this past week?",
  "What has been weighing on your mind lately?",
  "Is there something you’ve been avoiding thinking about?",
  "What moment recently made you feel stressed?",
  "What has brought you a sense of relief recently?",
  "Is there a conversation you wish had gone differently?",
  "What feels unresolved in your life right now?",
  "When did you last feel truly calm?",
  "What has been draining your energy?",
  "What are you worried might happen next?",
  "What are you proud of yourself for?",
  "What situation has made you feel tense lately?",
  "What do you feel you’re not expressing fully?",
  "What responsibility feels heavy right now?",
  "What are you trying to stay strong about?",
  "What emotion do you notice most often during the day?",
  "What feels uncertain in your life right now?",
  "What would you change about the past week?",
];

/* ===============================
   TYPES
================================ */
type SessionSummary = {
  session_duration: string;
  avg_stress: number;
  stress_peaks: number;
  emotional_valence_balance: number;
  engagement_score: number;
  emotional_variability: string;
  concealed_emotion_index: number;
  dominant_emotion: string;
  overall_score?: number;
  audio_stress_proxy?: number;
};

type AudioSummary = {
  duration_sec: number;
  rms: number;
  peak: number;
  energy_db: number;
  zcr: number;
  silence_ratio: number;
  speech_ratio: number;
  speech_bursts: number;
  avg_burst_sec: number;
  burst_rate_per_min: number;
  pitch_mean_hz: number;
  pitch_std_hz: number;
  pitch_range_hz: number;
  stress_proxy: number;
  sample_rate: number;
};

export default function MediaAnalysis() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<number | null>(null);
  const questionIntervalRef = useRef<number | null>(null);

  const [secondsLeft, setSecondsLeft] = useState(RECORDING_DURATION);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [audioSummary, setAudioSummary] = useState<AudioSummary | null>(null);
  const [humanReport, setHumanReport] = useState<string[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reportPdfUrl, setReportPdfUrl] = useState<string | null>(null);

  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  /* ===============================
     CLEANUP
  ================================ */
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (questionIntervalRef.current) window.clearInterval(questionIntervalRef.current);
    };
  }, []);

  /* ===============================
     START RECORDING
  ================================ */
  const startRecording = async () => {
    setErrorMessage(null);
    setSessionSummary(null);
    setAudioSummary(null);
    setHumanReport(null);
    setReportPdfUrl(null);
    setRecordedVideoUrl(null);
    setSecondsLeft(RECORDING_DURATION);

    // Pick 3 random questions
    const shuffled = [...QUESTION_BANK].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, QUESTIONS_PER_SESSION);
    setQuestions(selected);
    setCurrentQuestionIndex(0);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    streamRef.current = stream;
    if (videoRef.current) videoRef.current.srcObject = stream;

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = e => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = handleRecordingStop;

    recorder.start();
    setIsRecording(true);

    // Countdown timer
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          recorder.stop();
          if (intervalRef.current) window.clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Rotate questions evenly
    const questionDuration = RECORDING_DURATION / QUESTIONS_PER_SESSION;
    let qIndex = 0;

    questionIntervalRef.current = window.setInterval(() => {
      qIndex += 1;
      if (qIndex < selected.length) {
        setCurrentQuestionIndex(qIndex);
      } else {
        if (questionIntervalRef.current) window.clearInterval(questionIntervalRef.current);
      }
    }, questionDuration * 1000);
  };

  /* ===============================
     STOP + UPLOAD
  ================================ */
  const handleRecordingStop = async () => {
    setIsRecording(false);
    setIsUploading(true);

    streamRef.current?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;

    const blob = new Blob(chunksRef.current, { type: "video/webm" });
    setRecordedVideoUrl(URL.createObjectURL(blob));

    try {
      const formData = new FormData();
      formData.append("video", blob, "session.webm");

      const res = await fetch(`${ANALYSIS_URL}/api/session/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.session_summary) {
        throw new Error("session_summary missing");
      }

      setSessionSummary(data.session_summary);
      setAudioSummary(data.audio_summary ?? null);
      setHumanReport(Array.isArray(data.human_report) ? data.human_report : null);
      setReportPdfUrl(data.report_pdf_url ? `${ANALYSIS_URL}${data.report_pdf_url}` : null);

      try {
        await apiRequest("POST", "/api/media/analyze", {
          mediaType: "VIDEO",
          duration: RECORDING_DURATION,
          recordingUrl: null,
          analysisResult: {
            session_summary: data.session_summary,
            human_report: data.human_report,
            audio_summary: data.audio_summary,
            frames_analyzed: data.frames_analyzed,
            audio_status: data.audio,
            report_pdf_url: data.report_pdf_url ? `${ANALYSIS_URL}${data.report_pdf_url}` : null,
          },
        });
      } catch (storeError) {
        console.warn("Failed to store media analysis session:", storeError);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Analysis failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  /* ===============================
     UI
  ================================ */
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Guided Reflection Session
              </CardTitle>
              <CardDescription>
                Answer the on-screen prompts naturally. There are no right or wrong answers.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Recording */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Recording (90 seconds)
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                {!recordedVideoUrl ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                  />
                ) : (
                  <video src={recordedVideoUrl} controls className="w-full h-full" />
                )}

                {isRecording && (
                  <>
                    <div className="absolute top-3 right-3 bg-black/70 px-3 py-1 rounded text-xl font-bold">
                      {secondsLeft}s
                    </div>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 px-4 py-2 rounded text-white text-sm max-w-[90%] text-center">
                      {questions[currentQuestionIndex]}
                    </div>
                  </>
                )}

                {!recordedVideoUrl && !isRecording && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="h-14 w-14 text-white/30" />
                  </div>
                )}
              </div>

              <div className="text-center">
                {!isRecording && !isUploading && (
                  <Button size="lg" onClick={startRecording}>
                    Start Session
                  </Button>
                )}
                {isUploading && (
                  <p className="text-sm text-muted-foreground">
                    Analyzing session…
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* HUMAN REPORT */}
          {humanReport && (
            <Card className="border-primary/40 bg-gradient-to-br from-primary/5 to-background">
              <CardHeader>
                <CardTitle>Session Reflection</CardTitle>
                <CardDescription>
                  This is a supportive reflection, not a medical diagnosis.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid gap-2">
                  {humanReport.map((line, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <span className="text-primary">•</span>
                      <p>{line}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* RAW METRICS */}
          {sessionSummary && (
            <Card className="border-muted">
              <CardHeader>
                <CardTitle>Session Metrics</CardTitle>
                <CardDescription>
                  Numerical indicators for reference.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-border p-3 bg-background/70">
                    <p className="text-muted-foreground text-xs">Overall Score</p>
                    <p className="text-foreground text-xl font-semibold">
                      {sessionSummary.overall_score ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3 bg-background/70">
                    <p className="text-muted-foreground text-xs">Dominant Emotion</p>
                    <p className="text-foreground font-semibold">{sessionSummary.dominant_emotion}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 bg-background/70">
                    <p className="text-muted-foreground text-xs">Avg Stress</p>
                    <p className="text-foreground text-xl font-semibold">{sessionSummary.avg_stress}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 bg-background/70">
                    <p className="text-muted-foreground text-xs">Engagement</p>
                    <p className="text-foreground text-xl font-semibold">{sessionSummary.engagement_score}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  <div className="rounded-lg border border-border p-3 bg-background/70">
                    <p className="text-muted-foreground text-xs">Valence Balance</p>
                    <p className="text-foreground font-medium">{sessionSummary.emotional_valence_balance}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 bg-background/70">
                    <p className="text-muted-foreground text-xs">Emotional Variability</p>
                    <p className="text-foreground font-medium">{sessionSummary.emotional_variability}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 bg-background/70">
                    <p className="text-muted-foreground text-xs">Stress Peaks</p>
                    <p className="text-foreground font-medium">{sessionSummary.stress_peaks}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 bg-background/70">
                    <p className="text-muted-foreground text-xs">Concealed Emotion</p>
                    <p className="text-foreground font-medium">{sessionSummary.concealed_emotion_index}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* DOWNLOAD REPORT */}
          {reportPdfUrl && (
            <Card>
              <CardContent className="pt-6 text-center">
                <a href={reportPdfUrl} target="_blank" rel="noreferrer">
                  <Button>Download PDF Report</Button>
                </a>
              </CardContent>
            </Card>
          )}

          {/* AUDIO METRICS */}
          {audioSummary && (
            <Card className="border-muted">
              <CardHeader>
                <CardTitle>Audio Metrics</CardTitle>
                <CardDescription>
                  Voice energy, pauses, and speech flow indicators.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-border p-3 bg-background/70">
                    <p className="text-muted-foreground text-xs">Energy (dB)</p>
                    <p className="text-foreground text-xl font-semibold">{audioSummary.energy_db}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 bg-background/70">
                    <p className="text-muted-foreground text-xs">Speech Ratio</p>
                    <p className="text-foreground text-xl font-semibold">{audioSummary.speech_ratio}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 bg-background/70">
                    <p className="text-muted-foreground text-xs">Pitch Std (Hz)</p>
                    <p className="text-foreground text-xl font-semibold">{audioSummary.pitch_std_hz}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 bg-background/70">
                    <p className="text-muted-foreground text-xs">Stress Proxy</p>
                    <p className="text-foreground text-xl font-semibold">{audioSummary.stress_proxy}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  <div className="rounded-lg border border-border p-3 bg-background/70">
                    <p className="text-muted-foreground text-xs">Silence Ratio</p>
                    <p className="text-foreground font-medium">{audioSummary.silence_ratio}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 bg-background/70">
                    <p className="text-muted-foreground text-xs">Bursts / Min</p>
                    <p className="text-foreground font-medium">{audioSummary.burst_rate_per_min}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 bg-background/70">
                    <p className="text-muted-foreground text-xs">Pitch Mean (Hz)</p>
                    <p className="text-foreground font-medium">{audioSummary.pitch_mean_hz}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 bg-background/70">
                    <p className="text-muted-foreground text-xs">Pitch Range (Hz)</p>
                    <p className="text-foreground font-medium">{audioSummary.pitch_range_hz}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {errorMessage && (
            <Card className="border-red-500">
              <CardContent className="text-red-500 text-sm">
                {errorMessage}
              </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
}
