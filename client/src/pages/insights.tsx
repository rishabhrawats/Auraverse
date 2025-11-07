import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EIChart } from "@/components/insights/ei-chart";
import type { EISnapshot } from "@/types";

const TIME_WINDOWS = [
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 28, label: "28 days" },
];

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

  const isLoading = eiLoading || correlationLoading;

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
      </div>
    </>
  );
}
