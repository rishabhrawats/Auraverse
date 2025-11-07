import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgramCard } from "@/components/programs/program-card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ProgramAssignment } from "@/types";

const AVAILABLE_PROGRAMS = [
  {
    code: 'FOUNDERS-FOCUS-7D',
    title: 'Founders Focus',
    description: '7-day program for attention & task initiation skills',
    duration: '7 days',
    type: 'CBT-informed',
    icon: 'fas fa-crosshairs',
    color: 'primary',
  },
  {
    code: 'SLEEP-RESET-10D',
    title: 'Sleep Reset',
    description: '10-day program for wind-down & stimulus control',
    duration: '10 days',
    type: 'ACT-informed',
    icon: 'fas fa-moon',
    color: 'chart-3',
  },
  {
    code: 'CALM-FOR-PITCH-48H',
    title: 'Calm for Pitch',
    description: '48-hour program for pre-pitch composure',
    duration: '2 days',
    type: 'Micro-skills',
    icon: 'fas fa-bullhorn',
    color: 'chart-1',
  },
  {
    code: 'CONFLICT-CONTAIN-3D',
    title: 'Conflict Contain',
    description: '3-day program for de-escalation skills',
    duration: '3 days',
    type: 'DBT-informed',
    icon: 'fas fa-users',
    color: 'chart-2',
  },
  {
    code: 'RESILIENCE-BUILDER-14D',
    title: 'Resilience Builder',
    description: '14-day program for stress tolerance',
    duration: '14 days',
    type: 'CBT + ACT',
    icon: 'fas fa-shield-alt',
    color: 'chart-4',
  },
];

export default function Programs() {
  const { toast } = useToast();

  // Fetch user programs
  const { data: userPrograms, isLoading } = useQuery<ProgramAssignment[]>({
    queryKey: ["/api/programs"],
  });

  const { data: userProfile } = useQuery({
    queryKey: ["/api/me"],
  });

  // Assign program mutation
  const assignProgramMutation = useMutation({
    mutationFn: async (programCode: string) => {
      const response = await apiRequest("POST", "/api/programs/assign", { programCode });
      return response.json();
    },
    onSuccess: (data, programCode) => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      const program = AVAILABLE_PROGRAMS.find(p => p.code === programCode);
      toast({
        title: "BOSS Sprint Started!",
        description: `${program?.title} sprint has been activated.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Start BOSS Sprint",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isPro = userProfile?.subscription?.planType === 'PRO_99';
  const activePrograms = userPrograms?.filter(p => p.status === 'ACTIVE') || [];
  const canStartMultiplePrograms = isPro;
  const hasActivePrograms = activePrograms.length > 0;

  const handleStartProgram = (programCode: string) => {
    if (!canStartMultiplePrograms && hasActivePrograms) {
      toast({
        title: "Upgrade Required",
        description: "Upgrade to Growth Plan to run multiple BOSS sprints simultaneously.",
        variant: "destructive",
      });
      return;
    }
    
    assignProgramMutation.mutate(programCode);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Header 
        title="BOSS - Behavioral Optimization Sprint System" 
        subtitle="5-7 day guided micro-programs that transform behavior through real-time reflection, action, and feedback"
      />
      
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Active Programs Section */}
        {hasActivePrograms && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4" data-testid="text-active-programs">
              Active BOSS Sprints
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {activePrograms.map((assignment) => {
                const program = AVAILABLE_PROGRAMS.find(p => p.code === assignment.programCode);
                if (!program) return null;
                
                return (
                  <Card 
                    key={assignment.id} 
                    className="bg-card border-primary/50"
                    data-testid={`card-active-program-${assignment.id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-14 h-14 rounded-xl bg-${program.color}/20 flex items-center justify-center`}>
                          <i className={`${program.icon} text-${program.color} text-2xl`}></i>
                        </div>
                        <Badge variant="secondary" className="bg-primary/20 text-primary">
                          ACTIVE
                        </Badge>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-foreground mb-2" data-testid={`text-program-title-${assignment.id}`}>
                        {program.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {program.description}
                      </p>
                      
                      {/* Progress */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground">Progress</span>
                          <span className="text-xs text-muted-foreground">
                            Day {assignment.currentDay} of {assignment.totalDays}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`bg-${program.color} h-2 rounded-full transition-smooth`}
                            style={{ width: `${(assignment.currentDay / assignment.totalDays) * 100}%` }}
                          />
                        </div>
                      </div>

                      <Button 
                        className="w-full" 
                        variant="default"
                        data-testid={`button-continue-program-${assignment.id}`}
                      >
                        Continue Sprint
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Programs */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4" data-testid="text-available-programs">
            Available BOSS Sprints
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AVAILABLE_PROGRAMS.map((program) => {
              const isActive = activePrograms.some(ap => ap.programCode === program.code);
              const canStart = canStartMultiplePrograms || !hasActivePrograms || isActive;
              
              return (
                <ProgramCard
                  key={program.code}
                  program={program}
                  isActive={isActive}
                  canStart={canStart}
                  onStart={() => handleStartProgram(program.code)}
                  isLoading={assignProgramMutation.isPending}
                />
              );
            })}

            {/* Pro-only Multi-Program Card */}
            {!isPro && (
              <Card className="bg-card border-primary/30 relative overflow-hidden" data-testid="card-pro-upgrade">
                <CardContent className="p-6">
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-primary/20 text-primary">PRO</Badge>
                  </div>
                  
                  <div className="w-14 h-14 rounded-xl bg-chart-5/20 flex items-center justify-center mb-4">
                    <i className="fas fa-rocket text-chart-5 text-2xl"></i>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-2">Multi-Sprint Mode</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Run multiple BOSS sprints simultaneously for accelerated progress
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Badge variant="outline">Advanced</Badge>
                    <Badge variant="outline">Pro only</Badge>
                  </div>

                  <Button 
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="button-upgrade-pro"
                  >
                    Upgrade to Pro
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Program Information */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">About BOSS Sprints</h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                BOSS (Behavioral Optimization Sprint System) sprints use evidence-based therapeutic approaches (CBT, ACT, DBT) delivered through 
                supportive AI coaching. Each 5-7 day sprint is designed specifically for entrepreneurs and founders, 
                focusing on practical skills you can use immediately.
              </p>
              <p>
                <strong className="text-foreground">Not prescriptive therapy:</strong> BOSS sprints provide 
                supportive, skills-based assistance with clear disclaimers. We focus on normalization, 
                small wins, and founder-friendly language.
              </p>
              <p>
                <strong className="text-foreground">Personalized delivery:</strong> Each session adapts to 
                your avatar archetype, current state, venture stage, and calendar context for maximum relevance.
              </p>
              <p className="italic text-primary">
                <strong>"Be your own BOSS."</strong> Transform behavior through real-time reflection, action, and feedback.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
