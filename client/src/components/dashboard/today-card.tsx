import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ProgramAssignment } from "@/types";

interface TodayCardProps {
  currentProgram?: ProgramAssignment & {
    nextStep?: {
      title: string;
      content: string;
      day: number;
    };
  };
  currentState?: string;
  onCompleteStep?: () => void;
  onStartZen?: () => void;
}

export function TodayCard({ 
  currentProgram, 
  currentState = "REGULATED",
  onCompleteStep,
  onStartZen
}: TodayCardProps) {
  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'REGULATED': return 'bg-primary/20 text-primary';
      case 'FIGHT': return 'bg-destructive/20 text-destructive';
      case 'FLIGHT': return 'bg-chart-3/20 text-chart-3';
      case 'FREEZE': return 'bg-chart-1/20 text-chart-1';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  return (
    <Card className="lg:col-span-2 bg-card border-border purple-glow-hover" data-testid="card-today">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground" data-testid="text-today-title">
              Today's Focus
            </h3>
            <p className="text-sm text-muted-foreground mt-1" data-testid="text-today-date">
              {formatDate()}
            </p>
          </div>
          <span 
            className={`px-3 py-1 text-xs font-medium rounded-full ${getStateColor(currentState)}`}
            data-testid="text-current-state"
          >
            {currentState}
          </span>
        </div>

        {/* Next Program Step */}
        {currentProgram?.nextStep && (
          <div className="bg-accent rounded-lg p-4 mb-4" data-testid="card-program-step">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-brain text-primary"></i>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground mb-1" data-testid="text-program-title">
                  {currentProgram.programCode} - Day {currentProgram.nextStep.day}
                </h4>
                <p className="text-sm text-muted-foreground mb-3" data-testid="text-program-description">
                  {currentProgram.nextStep.title}
                </p>
                <Button 
                  onClick={onCompleteStep}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid="button-complete-step"
                >
                  Complete Step
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Zen Mode */}
        <div 
          className="flex items-center gap-3 p-4 border border-border rounded-lg hover:border-primary transition-smooth cursor-pointer group"
          onClick={onStartZen}
          data-testid="card-zen-quick"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-smooth">
            <i className="fas fa-spa text-primary text-xl"></i>
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-foreground" data-testid="text-zen-title">
              Start Zen Session
            </h4>
            <p className="text-sm text-muted-foreground" data-testid="text-zen-description">
              25 min · Breathing overlay · Distraction guard
            </p>
          </div>
          <i className="fas fa-arrow-right text-muted-foreground group-hover:text-primary transition-smooth"></i>
        </div>
      </CardContent>
    </Card>
  );
}
