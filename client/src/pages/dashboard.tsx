import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { TodayCard } from "@/components/dashboard/today-card";
import { EIScoreCard } from "@/components/dashboard/ei-score-card";
import { SubIndices } from "@/components/dashboard/sub-indices";
import { DashboardTour } from "@/components/dashboard/dashboard-tour";
import { WearableCard } from "@/components/dashboard/wearable-card";
import { EncryptedEditor } from "@/components/journal/encrypted-editor";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { EISnapshot, ProgramAssignment, CalendarWorkload } from "@/types";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showTour, setShowTour] = useState(false);

  // Fetch dashboard data
  const { data: userProfile } = useQuery({
    queryKey: ["/api/me"],
    enabled: !!user,
  });

  const { data: latestEI } = useQuery<EISnapshot>({
    queryKey: ["/api/ei/latest"],
    enabled: !!user,
  });

  const { data: programs } = useQuery<ProgramAssignment[]>({
    queryKey: ["/api/programs"],
    enabled: !!user,
  });

  const { data: calendarWorkload } = useQuery<CalendarWorkload>({
    queryKey: ["/api/calendar/workload"],
    enabled: !!user,
  });

  // Show tour only after dashboard data is loaded
  useEffect(() => {
    const tourCompleted = localStorage.getItem('dashboard_tour_completed');
    if (!tourCompleted && user && latestEI && programs) {
      setTimeout(() => setShowTour(true), 500);
    }
  }, [user, latestEI, programs]);

  // Mutations
  const completeStepMutation = useMutation({
    mutationFn: async ({ assignmentId, stepId }: { assignmentId: string; stepId?: string }) => {
      const response = await apiRequest("POST", "/api/programs/step/complete", {
        assignmentId,
        stepId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      toast({
        title: "Step Completed!",
        description: "Great job! Your next program step is ready.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startZenMutation = useMutation({
    mutationFn: async (duration: number = 25) => {
      const response = await apiRequest("POST", "/api/zen/start", { duration });
      return response.json();
    },
    onSuccess: () => {
      navigate("/zen");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveJournalMutation = useMutation({
    mutationFn: async ({ bodyCipher, title, tags }: { bodyCipher: string; title: string; tags: string[] }) => {
      const response = await apiRequest("POST", "/api/journal", {
        bodyCipher,
        title,
        tags,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const activePrograms = programs?.filter(p => p.status === 'ACTIVE') || [];
  const currentProgram = activePrograms[0];

  const handleCompleteStep = () => {
    if (currentProgram) {
      completeStepMutation.mutate({
        assignmentId: currentProgram.id,
      });
    }
  };

  const handleStartZen = () => {
    startZenMutation.mutate(25);
  };

  const handleSaveJournal = (bodyCipher: string, title: string, tags: string[]) => {
    saveJournalMutation.mutate({ bodyCipher, title, tags });
  };

  return (
    <>
      <Header 
        title="Dashboard" 
        subtitle="Welcome back, {userName}"
        userName={user?.name || ""}
      />
      
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Today Card & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TodayCard
            currentProgram={currentProgram}
            currentState={latestEI?.state || "REGULATED"}
            onCompleteStep={handleCompleteStep}
            onStartZen={handleStartZen}
          />
          <EIScoreCard
            currentEI={latestEI}
            onViewInsights={() => navigate("/insights")}
          />
        </div>

        {/* Sub-Indices */}
        <SubIndices currentEI={latestEI} />

        {/* Active Programs & Quick Journal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Programs */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground" data-testid="text-active-programs">
                  Active Programs
                </h3>
                <Button 
                  variant="link" 
                  className="text-primary hover:text-primary/80"
                  onClick={() => navigate("/programs")}
                  data-testid="button-browse-programs"
                >
                  Browse All
                </Button>
              </div>

              <div className="space-y-4">
                {activePrograms.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No active programs</p>
                    <Button onClick={() => navigate("/programs")} data-testid="button-start-program">
                      Start Your First Program
                    </Button>
                  </div>
                ) : (
                  activePrograms.map((program) => (
                    <div key={program.id} className="border border-border rounded-lg p-4" data-testid={`card-program-${program.id}`}>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-crosshairs text-primary"></i>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground mb-1" data-testid={`text-program-name-${program.id}`}>
                            {program.programCode.replace(/-/g, ' ')}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Day {program.currentDay} of {program.totalDays}
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-smooth" 
                                style={{ width: `${(program.currentDay / program.totalDays) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              Day {program.currentDay} of {program.totalDays}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Journal */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <EncryptedEditor
                onSave={handleSaveJournal}
                userId={user?.id || ""}
              />
            </CardContent>
          </Card>
        </div>

        {/* Calendar Integration */}
        {calendarWorkload && (
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground" data-testid="text-calendar-insights">
                    Calendar Insights
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Next 48 hours workload analysis</p>
                </div>
                <Button 
                  variant="outline"
                  className="flex items-center gap-2 text-sm"
                  data-testid="button-calendar-connected"
                >
                  <i className="fab fa-google text-primary"></i>
                  <span>Connected</span>
                  <i className="fas fa-check text-chart-2 text-xs"></i>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-accent rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <i className="fas fa-calendar-alt text-primary"></i>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground" data-testid="text-calendar-density">
                        {Math.round(calendarWorkload.calendarDensity)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Calendar density</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {calendarWorkload.calendarDensity > 70 ? "High meeting load detected" : "Manageable workload"}
                  </p>
                </div>

                <div className="bg-accent rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-chart-3/20 flex items-center justify-center">
                      <i className="fas fa-clock text-chart-3"></i>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground" data-testid="text-longest-block">
                        {calendarWorkload.longestBlockHours.toFixed(1)}h
                      </p>
                      <p className="text-xs text-muted-foreground">Longest block</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Continuous meetings</p>
                </div>

                <div className="bg-accent rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-chart-5/20 flex items-center justify-center">
                      <i className="fas fa-moon text-chart-5"></i>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground" data-testid="text-evening-events">
                        {calendarWorkload.eveningEvents}
                      </p>
                      <p className="text-xs text-muted-foreground">Evening events</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Consider recovery time</p>
                </div>
              </div>

              {calendarWorkload.calendarDensity > 60 && (
                <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <i className="fas fa-lightbulb text-primary mt-0.5"></i>
                    <div>
                      <p className="text-sm font-medium text-foreground">Recommendation</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your calendar shows high density today. Consider scheduling a 25-min Zen session 
                        after your peak block to optimize recovery latency.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Wearable Devices */}
        <WearableCard />
      </div>

      {/* Dashboard Tour for First-Time Users */}
      {showTour && <DashboardTour onComplete={() => setShowTour(false)} />}
    </>
  );
}
