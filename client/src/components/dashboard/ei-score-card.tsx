import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { EISnapshot } from "@/types";

interface EIScoreCardProps {
  currentEI?: EISnapshot;
  weeklyAverage?: number;
  trend?: number;
  onViewInsights?: () => void;
}

export function EIScoreCard({ 
  currentEI, 
  weeklyAverage = 76, 
  trend = 2.5,
  onViewInsights 
}: EIScoreCardProps) {
  const score = currentEI?.score || 78;
  const strokeDashoffset = 440 - (440 * score) / 100; // 440 is the circumference

  return (
    <Card className="bg-card border-border purple-glow-hover" data-testid="card-ei-score">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-primary mb-4" data-testid="text-ei-title">
          Resilience Score
        </h3>
        
        {/* EI Score Circle */}
        <div className="flex justify-center mb-6">
          <div className="relative w-40 h-40">
            <svg className="transform -rotate-90 w-40 h-40">
              <circle 
                cx="80" 
                cy="80" 
                r="70" 
                stroke="hsl(var(--muted))" 
                strokeWidth="8" 
                fill="none"
              />
              <circle 
                cx="80" 
                cy="80" 
                r="70" 
                stroke="hsl(var(--primary))" 
                strokeWidth="8" 
                fill="none"
                strokeDasharray="440" 
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-foreground" data-testid="text-ei-score">
                {score}
              </span>
              <span className="text-xs text-muted-foreground">out of 100</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">7-day average</span>
            <span className="font-medium text-foreground" data-testid="text-weekly-average">
              {weeklyAverage}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Trend</span>
            <span className="font-medium text-chart-2 flex items-center gap-1" data-testid="text-ei-trend">
              <i className="fas fa-arrow-up text-xs"></i>
              +{trend}%
            </span>
          </div>
        </div>

        <Button
          onClick={onViewInsights}
          variant="outline"
          className="w-full mt-4"
          data-testid="button-view-insights"
        >
          View Detailed Insights
        </Button>
      </CardContent>
    </Card>
  );
}
