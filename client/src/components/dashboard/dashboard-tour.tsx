import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ArrowRight, ArrowLeft } from "lucide-react";

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    target: '[data-testid="card-ei-score"]',
    title: "Effectiveness Index",
    description: "Your real-time mental wellness score based on 6 metrics: Focus Efficiency, Recovery Latency, Decision Clarity, Emotion Regulation, Support Utilization, and Strategic Momentum.",
    position: 'left'
  },
  {
    target: '[data-testid="card-today"]',
    title: "Today's Focus",
    description: "Complete your daily program step and quickly start a 25-minute Zen session with breathing overlay and distraction guard.",
    position: 'bottom'
  },
  {
    target: '[data-testid="nav-ai-oracle"]',
    title: "AI Oracle",
    description: "Ask questions about your mental wellness, get personalized insights, and receive AI-coached guidance.",
    position: 'right'
  },
  {
    target: '[data-testid="nav-programs"]',
    title: "Therapeutic Programs",
    description: "Browse AI-generated therapeutic programs tailored to your venture stage, stressors, and archetype.",
    position: 'right'
  },
  {
    target: '[data-testid="nav-zen"]',
    title: "Zen Mode",
    description: "Start focused work sessions with calendar-aware distraction blocking and breathing overlays.",
    position: 'right'
  },
  {
    target: '[data-testid="nav-journal"]',
    title: "Encrypted Journal",
    description: "Your thoughts are safe here. All journal entries are encrypted client-side before being saved.",
    position: 'right'
  },
  {
    target: '[data-testid="nav-insights"]',
    title: "Insights & Analytics",
    description: "Explore correlations between your EI scores, calendar patterns, and mental wellness trends.",
    position: 'right'
  }
];

interface DashboardTourProps {
  onComplete: () => void;
}

export function DashboardTour({ onComplete }: DashboardTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const step = tourSteps[currentStep];
    let element: Element | null = null;
    let retryCount = 0;
    const maxRetries = 20; // Try for 2 seconds (20 * 100ms)
    let timeoutId: NodeJS.Timeout | null = null;
    let cancelled = false;

    const attemptHighlight = () => {
      if (cancelled) return;

      element = document.querySelector(step.target);
      
      if (element) {
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Highlight the element
        element.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background');
      } else if (retryCount < maxRetries) {
        // Element not found yet, retry after delay
        retryCount++;
        timeoutId = setTimeout(attemptHighlight, 100);
      }
    };

    attemptHighlight();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (element) {
        element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background');
      }
    };
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      const prevElement = document.querySelector(tourSteps[currentStep].target);
      if (prevElement) {
        prevElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background');
      }
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevElement = document.querySelector(tourSteps[currentStep].target);
      if (prevElement) {
        prevElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background');
      }
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    const element = document.querySelector(tourSteps[currentStep].target);
    if (element) {
      element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background');
    }
    localStorage.setItem('dashboard_tour_completed', 'true');
    onComplete();
  };

  const step = tourSteps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 z-40 transition-opacity"
        onClick={handleComplete}
        data-testid="tour-overlay"
      />

      {/* Tour Card */}
      <Card
        className={`fixed z-50 bg-card border-primary shadow-2xl purple-glow ${
          isMobile
            ? 'bottom-4 left-4 right-4 w-auto'
            : 'w-96 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
        }`}
        data-testid="tour-card"
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                {currentStep + 1}
              </div>
              <h3 className="text-lg font-semibold text-primary">{step.title}</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleComplete}
              className="h-8 w-8 p-0"
              data-testid="button-close-tour"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            {step.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-6 bg-primary'
                      : index < currentStep
                      ? 'w-1.5 bg-primary/50'
                      : 'w-1.5 bg-muted'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  data-testid="button-tour-prev"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleNext}
                data-testid="button-tour-next"
              >
                {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
                {currentStep < tourSteps.length - 1 && <ArrowRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
