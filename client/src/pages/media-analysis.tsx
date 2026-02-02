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

const RECORDING_DURATION = 30;

type SessionSummary = {
  session_duration: string;
  avg_stress: number;
  stress_peaks: number;
  emotional_valence_balance: number;
  engagement_score: number;
  emotional_variability: string;
  concealed_emotion_index: number;
  dominant_emotion: string;
};

export default function MediaAnalysis() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [secondsLeft, setSecondsLeft] = useState(RECORDING_DURATION);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [humanReport, setHumanReport] = useState<string[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // ---------------------------
  // START RECORDING
  // ---------------------------
  const startRecording = async () => {
    setErrorMessage(null);
    setSessionSummary(null);
    setHumanReport(null);
    setRecordedVideoUrl(null);
    setSecondsLeft(RECORDING_DURATION);

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

    let remaining = RECORDING_DURATION;
    const interval = setInterval(() => {
      remaining -= 1;
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        recorder.stop();
      }
    }, 1000);
  };

  // ---------------------------
  // STOP + UPLOAD
  // ---------------------------
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

      const res = await fetch("http://localhost:8000/api/session/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("BACKEND RESPONSE:", data);

      if (!data.session_summary) {
        throw new Error("session_summary missing");
      }

      setSessionSummary(data.session_summary);
      setHumanReport(Array.isArray(data.human_report) ? data.human_report : null);

    } catch (err) {
      console.error(err);
      setErrorMessage("Analysis failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

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
                Session Instructions
              </CardTitle>
              <CardDescription>
                Speak naturally about your current emotional state for 30 seconds.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Recording */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Recording
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
                  <div className="absolute top-3 right-3 bg-black/70 px-3 py-1 rounded text-xl font-bold">
                    {secondsLeft}s
                  </div>
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
                    Start Recording
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

          {/* HUMAN READABLE REPORT */}
          {humanReport && (
            <Card className="border-primary/40">
              <CardHeader>
                <CardTitle>Session Reflection</CardTitle>
                <CardDescription>
                  A plain-language summary of your emotional signals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {humanReport.map((line, idx) => (
                  <p key={idx}>• {line}</p>
                ))}
              </CardContent>
            </Card>
          )}

          {/* RAW METRICS (SECONDARY) */}
          {sessionSummary && (
            <Card className="border-muted">
              <CardHeader>
                <CardTitle>Session Metrics</CardTitle>
                <CardDescription>
                  Detailed numerical indicators (for reference)
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><strong>Dominant Emotion:</strong> {sessionSummary.dominant_emotion}</p>
                <p><strong>Average Stress:</strong> {sessionSummary.avg_stress}</p>
                <p><strong>Engagement:</strong> {sessionSummary.engagement_score}</p>
                <p><strong>Valence Balance:</strong> {sessionSummary.emotional_valence_balance}</p>
                <p><strong>Variability:</strong> {sessionSummary.emotional_variability}</p>
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
