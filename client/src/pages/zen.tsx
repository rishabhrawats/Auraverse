import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ZenTimer } from "@/components/zen/zen-timer";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ZenMode() {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(25); // minutes
  const [timeRemaining, setTimeRemaining] = useState(duration * 60); // seconds
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale');
  const [breathingCount, setBreathingCount] = useState(4);
  
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Start zen session mutation
  const startZenMutation = useMutation({
    mutationFn: async (duration: number) => {
      const response = await apiRequest("POST", "/api/zen/start", { duration });
      return response.json();
    },
    onSuccess: (data) => {
      setSessionId(data.id);
      setIsActive(true);
      setTimeRemaining(duration * 60);
    },
    onError: (error) => {
      toast({
        title: "Failed to Start Session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Complete zen session mutation
  const completeZenMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest("POST", "/api/zen/complete", { sessionId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Session Completed!",
        description: "Great job! Your zen session has been logged.",
      });
      navigate("/dashboard");
    },
  });

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            if (sessionId) {
              completeZenMutation.mutate(sessionId);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, isPaused, timeRemaining, sessionId]);

  // Breathing pattern logic (4-7-8 pattern)
  useEffect(() => {
    let breathingInterval: NodeJS.Timeout;
    
    if (isActive && !isPaused) {
      breathingInterval = setInterval(() => {
        setBreathingCount((prev) => {
          if (prev <= 1) {
            setBreathingPhase((currentPhase) => {
              switch (currentPhase) {
                case 'inhale': return 'hold';
                case 'hold': return 'exhale';
                case 'exhale': return 'pause';
                case 'pause': return 'inhale';
                default: return 'inhale';
              }
            });
            
            // Set count for next phase
            switch (breathingPhase) {
              case 'inhale': return 7; // hold for 7
              case 'hold': return 8; // exhale for 8
              case 'exhale': return 1; // pause for 1
              case 'pause': return 4; // inhale for 4
              default: return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (breathingInterval) {
        clearInterval(breathingInterval);
      }
    };
  }, [isActive, isPaused, breathingPhase]);

  const handleStart = (selectedDuration: number = 25) => {
    setDuration(selectedDuration);
    startZenMutation.mutate(selectedDuration);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleExtend = () => {
    setTimeRemaining(prev => prev + 10 * 60); // Add 10 minutes
    setDuration(prev => prev + 10);
  };

  const handleComplete = () => {
    if (sessionId) {
      completeZenMutation.mutate(sessionId);
    } else {
      navigate("/dashboard");
    }
  };

  const handleExit = () => {
    navigate("/dashboard");
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getBreathingText = () => {
    switch (breathingPhase) {
      case 'inhale': return `Breathe in... ${breathingCount}`;
      case 'hold': return `Hold... ${breathingCount}`;
      case 'exhale': return `Breathe out... ${breathingCount}`;
      case 'pause': return `Pause... ${breathingCount}`;
      default: return 'Breathe...';
    }
  };

  // If not active, show start screen
  if (!isActive) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="text-zen-title">
              Zen Mode
            </h1>
            <p className="text-muted-foreground text-lg">
              Find your focus with guided breathing and distraction-free meditation
            </p>
          </div>

          {/* Duration Selection */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Choose Duration</h2>
            <div className="flex gap-4 justify-center">
              {[15, 25, 45].map((mins) => (
                <Button
                  key={mins}
                  variant={duration === mins ? "default" : "outline"}
                  onClick={() => setDuration(mins)}
                  className="px-6 py-3"
                  data-testid={`button-duration-${mins}`}
                >
                  {mins} min
                </Button>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="bg-card border border-border rounded-xl p-6 max-w-md mx-auto">
            <h3 className="font-semibold text-foreground mb-4">Session Features</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <i className="fas fa-shield-alt text-primary"></i>
                <span>Distraction guard (notifications muted)</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-lungs text-primary"></i>
                <span>4-7-8 breathing guidance</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-calendar-plus text-primary"></i>
                <span>Automatic calendar blocking</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-chart-line text-primary"></i>
                <span>Session tracking for EI computation</span>
              </div>
            </div>
          </div>

          <Button
            onClick={() => handleStart(duration)}
            disabled={startZenMutation.isPending}
            size="lg"
            className="px-8 py-4 text-lg"
            data-testid="button-start-zen"
          >
            {startZenMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Starting...
              </>
            ) : (
              <>
                <i className="fas fa-spa mr-2"></i>
                Start {duration} Min Session
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Active zen session
  return (
    <div className="fixed inset-0 bg-background z-50" data-testid="zen-active-session">
      <div className="h-full flex flex-col items-center justify-center p-8">
        
        {/* Exit Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-8 right-8 w-12 h-12 rounded-full hover:bg-accent"
          onClick={handleExit}
          data-testid="button-exit-zen"
        >
          <i className="fas fa-times text-muted-foreground"></i>
        </Button>

        {/* Breathing Circle */}
        <div className="relative mb-12">
          <ZenTimer 
            isActive={isActive && !isPaused}
            breathingPhase={breathingPhase}
          />
        </div>

        {/* Timer Display */}
        <div className="text-center mb-8">
          <div className="text-6xl font-bold text-foreground mb-4" data-testid="text-time-remaining">
            {formatTime(timeRemaining)}
          </div>
          <p className="text-muted-foreground">
            {isPaused ? "Paused" : "Zen Mode Active"}
          </p>
        </div>

        {/* Breathing Guide */}
        <div className="text-center mb-12">
          <p className="text-lg text-foreground mb-2" data-testid="text-breathing-guide">
            {getBreathingText()}
          </p>
          <p className="text-sm text-muted-foreground">4-7-8 breathing pattern</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handlePause}
            disabled={completeZenMutation.isPending}
            data-testid="button-pause-zen"
          >
            <i className={`fas ${isPaused ? 'fa-play' : 'fa-pause'} mr-2`}></i>
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          
          <Button
            onClick={handleExtend}
            disabled={completeZenMutation.isPending}
            data-testid="button-extend-zen"
          >
            <i className="fas fa-plus mr-2"></i>
            Extend 10min
          </Button>
          
          <Button
            onClick={handleComplete}
            disabled={completeZenMutation.isPending}
            data-testid="button-complete-zen"
          >
            {completeZenMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Completing...
              </>
            ) : (
              <>
                <i className="fas fa-check mr-2"></i>
                Complete
              </>
            )}
          </Button>
        </div>

        {/* Distraction Guard Note */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <i className="fas fa-shield-alt text-primary"></i>
            Distraction guard active · All notifications muted
          </p>
        </div>
      </div>
    </div>
  );
}
