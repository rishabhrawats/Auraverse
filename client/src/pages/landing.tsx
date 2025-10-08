import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, Shield, TrendingUp } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent" data-testid="text-landing-title">
            AuraVerse AI
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-landing-subtitle">
            AI-Powered Mental Wellness for Entrepreneurs
          </p>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Real-time effectiveness tracking, therapeutic programs, and zen mode - all designed for founders like you
          </p>
        </div>

        <div className="flex justify-center mb-20">
          <Button 
            size="lg" 
            className="text-lg px-8 py-6"
            onClick={() => setLocation('/onboarding')}
            data-testid="button-start-free"
          >
            Start Free Trial <Sparkles className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-card p-6 rounded-lg border shadow-sm" data-testid="feature-ei">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Effectiveness Index</h3>
            </div>
            <p className="text-muted-foreground">
              Track your mental wellness with our 6-metric EI score in real-time
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border shadow-sm" data-testid="feature-programs">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">AI Therapeutic Programs</h3>
            </div>
            <p className="text-muted-foreground">
              Personalized programs powered by OpenAI and Anthropic AI
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border shadow-sm" data-testid="feature-privacy">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Client-Side Encryption</h3>
            </div>
            <p className="text-muted-foreground">
              Your journal entries are encrypted on your device, never on our servers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
