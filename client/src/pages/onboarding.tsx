import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface OnboardingData {
  ventureStage?: string;
  primaryStressors?: string[];
  avatarArchetype?: string;
  sleepHours?: number;
  workloadHrsWk?: number;
  timezone?: string;
  consent?: boolean;
}

const VENTURE_STAGES = [
  { value: 'IDEA', label: 'Idea', description: 'Conceptualizing' },
  { value: 'PRESEED', label: 'Pre-Seed', description: 'Building MVP' },
  { value: 'SEED', label: 'Seed', description: 'Initial funding' },
  { value: 'SERIES_A', label: 'Series A', description: 'Scaling up' },
  { value: 'GROWTH', label: 'Growth', description: 'Expanding' },
  { value: 'PRE_IPO', label: 'Pre-IPO', description: 'Preparing to go public' },
  { value: 'IPO', label: 'IPO', description: 'Public company' },
];

const STRESSOR_OPTIONS = [
  'Cashflow', 'Team', 'Product', 'Sales', 'Investors', 'Personal Life', 'Reputation', 'Competition'
];

const AVATAR_ARCHETYPES = [
  { value: 'VISIONARY', label: 'Visionary', description: 'Big picture thinker' },
  { value: 'OPERATOR', label: 'Operator', description: 'Execution focused' },
  { value: 'RAINMAKER', label: 'Rainmaker', description: 'Revenue driver' },
  { value: 'CRAFTSMAN', label: 'Craftsman', description: 'Quality focused' },
  { value: 'GUARDIAN', label: 'Guardian', description: 'Risk manager' },
  { value: 'EXPLORER', label: 'Explorer', description: 'Innovation seeker' },
  { value: 'STABILIZER', label: 'Stabilizer', description: 'Process builder' },
  { value: 'CATALYST', label: 'Catalyst', description: 'Change agent' },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    primaryStressors: [],
  });
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const completeMutation = useMutation({
    mutationFn: async (onboardingData: OnboardingData) => {
      const response = await apiRequest("POST", "/api/onboarding/complete", onboardingData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Welcome to AuraVerse!",
        description: "Your profile has been created. Let's start your journey.",
      });
      navigate("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStressorToggle = (stressor: string) => {
    const current = data.primaryStressors || [];
    if (current.includes(stressor)) {
      setData({
        ...data,
        primaryStressors: current.filter(s => s !== stressor)
      });
    } else {
      setData({
        ...data,
        primaryStressors: [...current, stressor]
      });
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!data.ventureStage;
      case 1: return data.primaryStressors && data.primaryStressors.length > 0;
      case 2: return !!data.avatarArchetype;
      case 3: return !!data.consent;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 2) {
      // After avatar selection, save data and redirect to signup
      sessionStorage.setItem('onboarding_data', JSON.stringify(data));
      navigate('/signup');
    } else if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <Card className="w-full max-w-2xl bg-card border-border">
        <CardContent className="p-8">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {step + 1}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 h-1 mx-2 ${
                      step < currentStep ? "bg-primary" : "bg-muted"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          {currentStep === 0 && (
            <div data-testid="onboarding-step-venture">
              <h2 className="text-2xl font-bold text-foreground mb-2">What stage is your venture at?</h2>
              <p className="text-muted-foreground mb-6">This helps us personalize your experience</p>

              <div className="grid grid-cols-2 gap-3">
                {VENTURE_STAGES.map((stage) => (
                  <Button
                    key={stage.value}
                    variant={data.ventureStage === stage.value ? "default" : "outline"}
                    className="p-4 h-auto text-left justify-start flex-col items-start"
                    onClick={() => setData({ ...data, ventureStage: stage.value })}
                    data-testid={`button-venture-${stage.value.toLowerCase()}`}
                  >
                    <p className="font-medium text-foreground mb-1">{stage.label}</p>
                    <p className="text-xs text-muted-foreground">{stage.description}</p>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div data-testid="onboarding-step-stressors">
              <h2 className="text-2xl font-bold text-foreground mb-2">What are your primary stressors?</h2>
              <p className="text-muted-foreground mb-6">Select all that apply - this helps us tailor your programs</p>

              <div className="grid grid-cols-2 gap-3">
                {STRESSOR_OPTIONS.map((stressor) => (
                  <div 
                    key={stressor}
                    className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-smooth ${
                      data.primaryStressors?.includes(stressor)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary"
                    }`}
                    onClick={() => handleStressorToggle(stressor)}
                    data-testid={`button-stressor-${stressor.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Checkbox 
                      checked={data.primaryStressors?.includes(stressor)}
                      readOnly
                    />
                    <span className="text-foreground">{stressor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div data-testid="onboarding-step-archetype">
              <h2 className="text-2xl font-bold text-foreground mb-2">Which archetype resonates with you?</h2>
              <p className="text-muted-foreground mb-6">This helps us customize your coaching approach</p>

              <div className="grid grid-cols-2 gap-3">
                {AVATAR_ARCHETYPES.map((archetype) => (
                  <Button
                    key={archetype.value}
                    variant={data.avatarArchetype === archetype.value ? "default" : "outline"}
                    className="p-4 h-auto text-left justify-start flex-col items-start"
                    onClick={() => setData({ ...data, avatarArchetype: archetype.value })}
                    data-testid={`button-archetype-${archetype.value.toLowerCase()}`}
                  >
                    <p className="font-medium text-foreground mb-1">{archetype.label}</p>
                    <p className="text-xs text-muted-foreground">{archetype.description}</p>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div data-testid="onboarding-step-details">
              <h2 className="text-2xl font-bold text-foreground mb-2">A few more details</h2>
              <p className="text-muted-foreground mb-6">Help us understand your lifestyle and preferences</p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Average sleep hours per night (optional)
                  </label>
                  <Input
                    type="number"
                    min="4"
                    max="12"
                    step="0.5"
                    value={data.sleepHours || ''}
                    onChange={(e) => setData({ ...data, sleepHours: parseFloat(e.target.value) || undefined })}
                    className="bg-input border-border"
                    data-testid="input-sleep-hours"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Work hours per week (optional)
                  </label>
                  <Input
                    type="number"
                    min="20"
                    max="100"
                    value={data.workloadHrsWk || ''}
                    onChange={(e) => setData({ ...data, workloadHrsWk: parseInt(e.target.value) || undefined })}
                    className="bg-input border-border"
                    data-testid="input-work-hours"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Timezone
                  </label>
                  <Input
                    value={data.timezone || ''}
                    onChange={(e) => setData({ ...data, timezone: e.target.value })}
                    className="bg-input border-border"
                    data-testid="input-timezone"
                  />
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      checked={data.consent || false}
                      onCheckedChange={(checked) => setData({ ...data, consent: !!checked })}
                      data-testid="checkbox-consent"
                    />
                    <div className="text-sm">
                      <p className="text-foreground font-medium mb-1">Data Processing Consent</p>
                      <p className="text-muted-foreground text-xs">
                        I consent to AuraVerse processing my data to provide personalized effectiveness insights, 
                        AI coaching programs, and calendar integration features. All journal entries will be 
                        encrypted client-side before transmission.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              data-testid="button-back"
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed() || completeMutation.isPending}
              data-testid="button-continue"
            >
              {completeMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Setting up...
                </>
              ) : currentStep === 3 ? (
                "Complete Setup"
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
