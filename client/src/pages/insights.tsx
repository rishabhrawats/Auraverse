import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EIChart } from "@/components/insights/ei-chart";
import type { EISnapshot } from "@/types";
import { apiRequest } from "@/lib/queryClient";

const TIME_WINDOWS = [
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 28, label: "28 days" },
];

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function buildSparkline(values: number[], width: number, height: number) {
  if (values.length < 2) return "";
  const step = width / (values.length - 1);
  return values
    .map((v, i) => {
      const x = Math.round(i * step);
      const y = Math.round(height - v * height);
      return `${x},${y}`;
    })
    .join(" ");
}

export default function Insights() {
  const [timeWindow, setTimeWindow] = useState(28);

  // Fetch EI trend data
  const { data: eiTrend, isLoading: eiLoading } = useQuery<EISnapshot[]>({
    queryKey: ["/api/ei/trend", { window: `${timeWindow}d` }],
  });

  // Fetch correlation data
  const { data: correlationData, isLoading: correlationLoading } = useQuery({
    queryKey: ["/api/insights/correlation", { days: timeWindow }],
  });

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ["media-sessions", timeWindow],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/media?limit=50`);
      return await res.json();
    },
  });

  const isLoading = eiLoading || correlationLoading || sessionsLoading;

  const sessions = sessionsData ?? [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Calculate insights from EI data
  const latestSnapshot = eiTrend?.[0];
  const previousSnapshot = eiTrend?.[1];
  const averageScore = eiTrend?.reduce((sum, snapshot) => sum + snapshot.score, 0) / (eiTrend?.length || 1);

  // Sub-index performance
  const subIndices = [
    { key: 'focusEfficiency', name: 'Focus Efficiency', color: 'primary' },
    { key: 'recoveryLatency', name: 'Recovery Latency', color: 'chart-2' },
    { key: 'decisionClarity', name: 'Decision Clarity', color: 'chart-3' },
    { key: 'emotionRegulation', name: 'Emotion Regulation', color: 'chart-4' },
    { key: 'supportUtilization', name: 'Support Utilization', color: 'chart-5' },
    { key: 'strategicMomentum', name: 'Strategic Momentum', color: 'primary' },
  ];

  const getBestPerformers = () => {
    if (!latestSnapshot || !previousSnapshot) return [];
    
    return subIndices.map(index => {
      const current = latestSnapshot[index.key as keyof EISnapshot] as number;
      const previous = previousSnapshot[index.key as keyof EISnapshot] as number;
      const change = current - previous;
      const changePercent = (change / previous) * 100;
      
      return {
        ...index,
        current,
        change,
        changePercent
      };
    }).sort((a, b) => b.changePercent - a.changePercent);
  };

  const bestPerformers = getBestPerformers().slice(0, 2);
  const focusAreas = getBestPerformers().slice(-2).reverse();

  return (
    <>
      <Header 
        title="Resilience Insights" 
        subtitle="Track your Resilience Index (RI) trends and correlations"
      />
      
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Time Window Selector */}
        <div className="flex items-center gap-3">
          {TIME_WINDOWS.map((window) => (
            <Button
              key={window.value}
              variant={timeWindow === window.value ? "default" : "outline"}
              onClick={() => setTimeWindow(window.value)}
              data-testid={`button-window-${window.value}`}
            >
              {window.label}
            </Button>
          ))}
        </div>

        {/* EI Trend Chart */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6" data-testid="text-ei-trend-title">
              Resilience Score Trend
            </h3>
            
            {eiTrend && eiTrend.length > 0 ? (
              <EIChart data={eiTrend} />
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <i className="fas fa-chart-line text-4xl mb-4 opacity-50"></i>
                  <p>No RI data available for the selected time period</p>
                </div>
              </div>
            )}

            {/* Summary Stats */}
            {latestSnapshot && (
              <div className="mt-6 pt-6 border-t border-border">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-current-score">
                      {latestSnapshot.score}
                    </p>
                    <p className="text-xs text-muted-foreground">Current Score</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-average-score">
                      {Math.round(averageScore)}
                    </p>
                    <p className="text-xs text-muted-foreground">{timeWindow}-Day Average</p>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${
                      previousSnapshot && latestSnapshot.score > previousSnapshot.score 
                        ? 'text-chart-2' 
                        : latestSnapshot.score < previousSnapshot.score
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                    }`} data-testid="text-trend">
                      {previousSnapshot 
                        ? `${latestSnapshot.score > previousSnapshot.score ? '+' : ''}${latestSnapshot.score - previousSnapshot.score}`
                        : '—'
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">vs Previous</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendar Correlation */}
        {correlationData && (
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6" data-testid="text-correlation-title">
                Calendar Workload Correlation
              </h3>
              
              <div className="space-y-4">
                {correlationData.insights?.map((insight: any, index: number) => (
                  <div key={index} className="border-b border-border last:border-b-0 pb-4 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-foreground" data-testid={`text-insight-metric-${index}`}>
                        RI Score vs {insight.metric}
                      </span>
                      <span className={`text-sm font-medium ${
                        insight.correlation > 0.3 ? 'text-chart-2' : 
                        insight.correlation < -0.3 ? 'text-destructive' : 
                        'text-chart-3'
                      }`} data-testid={`text-insight-correlation-${index}`}>
                        {insight.correlation > 0 ? '+' : ''}{insight.correlation.toFixed(2)} correlation
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground" data-testid={`text-insight-description-${index}`}>
                      {insight.description}
                    </p>
                  </div>
                ))}
              </div>

              {correlationData.dataPoints && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Based on {correlationData.dataPoints} data points over {timeWindow} days
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Performance Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Best Performers */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4" data-testid="text-best-performers">
                Best Performers
              </h3>
              <div className="space-y-3">
                {bestPerformers.length > 0 ? bestPerformers.map((performer, index) => (
                  <div key={performer.key} className="flex items-center gap-3" data-testid={`card-best-performer-${index}`}>
                    <div className={`w-8 h-8 rounded bg-${performer.color}/20 flex items-center justify-center flex-shrink-0`}>
                      <i className="fas fa-arrow-trend-up text-primary text-sm"></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground" data-testid={`text-performer-name-${index}`}>
                        {performer.name}
                      </p>
                      <p className="text-xs text-muted-foreground" data-testid={`text-performer-change-${index}`}>
                        {performer.changePercent > 0 ? '+' : ''}{performer.changePercent.toFixed(1)}% improvement
                      </p>
                    </div>
                    <span className="text-xl font-bold text-primary" data-testid={`text-performer-score-${index}`}>
                      {performer.current}
                    </span>
                  </div>
                )) : (
                  <p className="text-muted-foreground text-sm">Not enough data to show improvements</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Focus Areas */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4" data-testid="text-focus-areas">
                Focus Areas
              </h3>
              <div className="space-y-3">
                {focusAreas.length > 0 ? focusAreas.map((area, index) => (
                  <div key={area.key} className="flex items-center gap-3" data-testid={`card-focus-area-${index}`}>
                    <div className={`w-8 h-8 rounded bg-${area.color}/20 flex items-center justify-center flex-shrink-0`}>
                      <i className={`fas ${area.changePercent < -5 ? 'fa-arrow-trend-down' : 'fa-minus'} text-${area.color} text-sm`}></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground" data-testid={`text-area-name-${index}`}>
                        {area.name}
                      </p>
                      <p className="text-xs text-muted-foreground" data-testid={`text-area-change-${index}`}>
                        {Math.abs(area.changePercent) < 2 ? 'Stable' : `${area.changePercent.toFixed(1)}% this period`}
                      </p>
                    </div>
                    <span className={`text-xl font-bold text-${area.color}`} data-testid={`text-area-score-${index}`}>
                      {area.current}
                    </span>
                  </div>
                )) : (
                  <p className="text-muted-foreground text-sm">Not enough data to identify focus areas</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights Summary */}
        <Card className="bg-primary/5 border border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <i className="fas fa-lightbulb text-primary text-xl mt-1"></i>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Key Insights</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {latestSnapshot && previousSnapshot && (
                    <p>
                      Your effectiveness score has {latestSnapshot.score > previousSnapshot.score ? 'improved' : 'decreased'} by{' '}
                      <strong className="text-foreground">{Math.abs(latestSnapshot.score - previousSnapshot.score)} points</strong>{' '}
                      since your last measurement.
                    </p>
                  )}
                  
                  {correlationData?.insights?.[0] && (
                    <p>
                      <strong className="text-foreground">Calendar impact:</strong> {correlationData.insights[0].description.toLowerCase()}
                    </p>
                  )}
                  
                  {bestPerformers[0] && (
                    <p>
                      Your strongest area is <strong className="text-foreground">{bestPerformers[0].name}</strong> with recent improvements.
                    </p>
                  )}
                  
                  {focusAreas[0] && (
                    <p>
                      Consider focusing on <strong className="text-foreground">{focusAreas[0].name}</strong> for balanced growth.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session History */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Session History
              </h3>
              <span className="text-xs text-muted-foreground">
                Your recent media analysis sessions
              </span>
            </div>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
            ) : (
              <div className="space-y-6">
                {sessions.map((session: any) => {
                  const summary = session.analysisResult?.session_summary;
                  const overall = clamp01(summary?.overall_score ?? 0);
                  const engagement = clamp01(summary?.engagement_score ?? 0);
                  const calm = clamp01(1 - (summary?.avg_stress ?? 0));
                  const valence = clamp01(((summary?.emotional_valence_balance ?? 0) + 1) / 2);
                  const points = buildSparkline([overall, engagement, calm, valence, overall], 120, 28);

                  return (
                  <div key={session.id} className="border border-border rounded-xl p-5 bg-gradient-to-br from-background to-muted/30">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Session {session.id?.slice(0, 8)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {points && (
                          <div className="hidden sm:block">
                            <svg width="120" height="28" viewBox="0 0 120 28" fill="none">
                              <polyline
                                points={points}
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-primary/70"
                                fill="none"
                              />
                            </svg>
                          </div>
                        )}
                        <span className="text-[11px] px-2 py-1 rounded-full border border-border bg-background/70 text-muted-foreground">
                          Updated {new Date(session.createdAt).toLocaleDateString()}
                        </span>
                        {session.analysisResult?.session_summary?.dominant_emotion && (
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                            {session.analysisResult.session_summary.dominant_emotion}
                          </span>
                        )}
                        {session.analysisResult?.report_pdf_url && (
                          <a
                            href={session.analysisResult.report_pdf_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Button variant="outline" size="sm">Download PDF</Button>
                          </a>
                        )}
                      </div>
                    </div>

                    {session.analysisResult?.session_summary && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div className="rounded-lg bg-background/70 border border-border p-3">
                          <p className="text-muted-foreground">Overall Score</p>
                          <p className="text-foreground font-semibold text-lg">
                            {session.analysisResult.session_summary.overall_score ?? "—"}
                          </p>
                        </div>
                        <div className="rounded-lg bg-background/70 border border-border p-3">
                          <p className="text-muted-foreground">Avg Stress</p>
                          <p className="text-foreground font-semibold text-lg">
                            {session.analysisResult.session_summary.avg_stress}
                          </p>
                        </div>
                        <div className="rounded-lg bg-background/70 border border-border p-3">
                          <p className="text-muted-foreground">Engagement</p>
                          <p className="text-foreground font-semibold text-lg">
                            {session.analysisResult.session_summary.engagement_score}
                          </p>
                        </div>
                        <div className="rounded-lg bg-background/70 border border-border p-3">
                          <p className="text-muted-foreground">Valence</p>
                          <p className="text-foreground font-semibold text-lg">
                            {session.analysisResult.session_summary.emotional_valence_balance}
                          </p>
                        </div>
                      </div>
                    )}

                    {session.analysisResult?.human_report && (
                      <div className="mt-4 rounded-lg bg-primary/5 border border-primary/20 p-4">
                        <p className="text-sm font-semibold text-foreground mb-2">Coaching Highlights</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {session.analysisResult.human_report.slice(0, 3).map((line: string, idx: number) => (
                            <li key={idx}>• {line}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {session.analysisResult?.audio_summary && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div className="rounded-lg bg-background/70 border border-border p-3">
                          <p className="text-muted-foreground">Speech Ratio</p>
                          <p className="text-foreground font-medium">
                            {session.analysisResult.audio_summary.speech_ratio}
                          </p>
                        </div>
                        <div className="rounded-lg bg-background/70 border border-border p-3">
                          <p className="text-muted-foreground">Pitch Std (Hz)</p>
                          <p className="text-foreground font-medium">
                            {session.analysisResult.audio_summary.pitch_std_hz}
                          </p>
                        </div>
                        <div className="rounded-lg bg-background/70 border border-border p-3">
                          <p className="text-muted-foreground">Energy (dB)</p>
                          <p className="text-foreground font-medium">
                            {session.analysisResult.audio_summary.energy_db}
                          </p>
                        </div>
                        <div className="rounded-lg bg-background/70 border border-border p-3">
                          <p className="text-muted-foreground">Stress Proxy</p>
                          <p className="text-foreground font-medium">
                            {session.analysisResult.audio_summary.stress_proxy}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
