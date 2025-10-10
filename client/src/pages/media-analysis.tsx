import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Video, Camera, StopCircle, PlayCircle, Brain, Sparkles, TrendingUp } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { MediaAnalysisSession } from '@shared/schema';
import { format } from 'date-fns';

export default function MediaAnalysis() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mediaType, setMediaType] = useState<'VOICE' | 'VIDEO' | 'BOTH'>('VOICE');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const durationRef = useRef<number>(0);

  const { data: sessions = [], isLoading } = useQuery<MediaAnalysisSession[]>({
    queryKey: ['/api/media'],
    enabled: !!user,
  });

  const analyzeMutation = useMutation({
    mutationFn: async (data: { mediaType: string; duration: number }) => {
      return await apiRequest('POST', '/api/media/analyze', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/media'] });
      toast({
        title: 'Analysis Complete',
        description: 'Your mental wellness analysis is ready',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to analyze your session',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [stream]);

  const startRecording = async () => {
    try {
      const constraints = {
        audio: true,
        video: mediaType === 'VIDEO' || mediaType === 'BOTH',
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current && (mediaType === 'VIDEO' || mediaType === 'BOTH')) {
        videoRef.current.srcObject = mediaStream;
      }

      const mediaRecorder = new MediaRecorder(mediaStream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: mediaType === 'VOICE' ? 'audio/webm' : 'video/webm' });
        
        // In production, upload to object storage here
        // For now, just trigger analysis with duration
        await analyzeMutation.mutateAsync({
          mediaType,
          duration: durationRef.current,
        });

        setRecordingDuration(0);
        durationRef.current = 0;
      };

      mediaRecorder.start();
      setIsRecording(true);
      durationRef.current = 0;

      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setRecordingDuration(durationRef.current);
      }, 1000);

    } catch (error: any) {
      toast({
        title: 'Recording Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStateColor = (state: string) => {
    const colors: Record<string, string> = {
      calm: 'bg-green-500/10 text-green-600',
      anxious: 'bg-orange-500/10 text-orange-600',
      focused: 'bg-blue-500/10 text-blue-600',
      overwhelmed: 'bg-red-500/10 text-red-600',
      energized: 'bg-purple-500/10 text-purple-600',
    };
    return colors[state] || 'bg-gray-500/10 text-gray-600';
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              Voice & Video Analysis
            </h1>
            <p className="text-muted-foreground mt-2">
              Real-time mental wellness assessment through AI-powered voice and video analysis
            </p>
          </div>

          {/* Recording Interface */}
          <Card className="bg-gradient-to-br from-background to-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Capture Session
              </CardTitle>
              <CardDescription>
                Record voice or video for AI-powered mental wellness analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Media Type Selection */}
              <div className="flex gap-3">
                <Button
                  variant={mediaType === 'VOICE' ? 'default' : 'outline'}
                  onClick={() => setMediaType('VOICE')}
                  disabled={isRecording}
                  data-testid="button-select-voice"
                  className="flex-1"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Voice Only
                </Button>
                <Button
                  variant={mediaType === 'VIDEO' ? 'default' : 'outline'}
                  onClick={() => setMediaType('VIDEO')}
                  disabled={isRecording}
                  data-testid="button-select-video"
                  className="flex-1"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Video Only
                </Button>
                <Button
                  variant={mediaType === 'BOTH' ? 'default' : 'outline'}
                  onClick={() => setMediaType('BOTH')}
                  disabled={isRecording}
                  data-testid="button-select-both"
                  className="flex-1"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Both
                </Button>
              </div>

              {/* Video Preview */}
              {(mediaType === 'VIDEO' || mediaType === 'BOTH') && (
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                    data-testid="video-preview"
                  />
                  {!isRecording && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Camera className="h-12 w-12 text-white/50" />
                    </div>
                  )}
                </div>
              )}

              {/* Recording Controls */}
              <div className="flex items-center justify-center gap-4">
                {isRecording ? (
                  <div className="text-center space-y-3">
                    <div className="text-4xl font-mono font-bold text-primary" data-testid="text-duration">
                      {formatDuration(recordingDuration)}
                    </div>
                    <Button
                      onClick={stopRecording}
                      size="lg"
                      variant="destructive"
                      className="gap-2"
                      data-testid="button-stop-recording"
                    >
                      <StopCircle className="h-5 w-5" />
                      Stop & Analyze
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={startRecording}
                    size="lg"
                    className="gap-2"
                    disabled={analyzeMutation.isPending}
                    data-testid="button-start-recording"
                  >
                    <PlayCircle className="h-5 w-5" />
                    Start Recording
                  </Button>
                )}
              </div>

              {analyzeMutation.isPending && (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-primary">
                    <Brain className="h-5 w-5 animate-pulse" />
                    <span>Analyzing your session...</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis History */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              Analysis History
            </h2>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : sessions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No analysis sessions yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Start recording to get AI-powered wellness insights</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {sessions.map((session) => (
                  <Card key={session.id} data-testid={`card-session-${session.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {session.mediaType === 'VOICE' && <Mic className="h-4 w-4" />}
                            {session.mediaType === 'VIDEO' && <Video className="h-4 w-4" />}
                            {session.mediaType === 'BOTH' && <Camera className="h-4 w-4" />}
                            {session.mediaType} Analysis
                          </CardTitle>
                          <CardDescription>
                            {format(new Date(session.createdAt!), 'MMM d, yyyy • h:mm a')} • {session.duration}s
                          </CardDescription>
                        </div>
                        <Badge className={getStateColor(session.analysisResult?.emotionalState || 'calm')}>
                          {session.analysisResult?.emotionalState || 'Unknown'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Vocal Stress</span>
                            <span className="font-medium">{session.analysisResult?.vocalStressLevel || 0}/100</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${session.analysisResult?.vocalStressLevel || 0}%` }}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Overall Wellbeing</span>
                            <span className="font-medium">{session.analysisResult?.overallWellbeing || 0}/100</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 transition-all"
                              style={{ width: `${session.analysisResult?.overallWellbeing || 0}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Speech Pace:</span>
                          <span className="ml-2 font-medium">{session.analysisResult?.speechPace || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Pause Frequency:</span>
                          <span className="ml-2 font-medium">{session.analysisResult?.pauseFrequency || 'N/A'}</span>
                        </div>
                        {session.analysisResult?.facialExpression && (
                          <div>
                            <span className="text-muted-foreground">Facial Expression:</span>
                            <span className="ml-2 font-medium">{session.analysisResult.facialExpression}</span>
                          </div>
                        )}
                        {session.analysisResult?.bodyLanguage && (
                          <div>
                            <span className="text-muted-foreground">Body Language:</span>
                            <span className="ml-2 font-medium">{session.analysisResult.bodyLanguage}</span>
                          </div>
                        )}
                      </div>

                      {session.analysisResult?.recommendations && session.analysisResult.recommendations.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">AI Recommendations</h4>
                          <ul className="space-y-1">
                            {session.analysisResult.recommendations.map((rec, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
