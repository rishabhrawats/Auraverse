import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Program {
  code: string;
  title: string;
  description: string;
  duration: string;
  type: string;
  icon: string;
  color: string;
}

interface ProgramCardProps {
  program: Program;
  isActive: boolean;
  canStart: boolean;
  onStart: () => void;
  isLoading: boolean;
}

export function ProgramCard({ program, isActive, canStart, onStart, isLoading }: ProgramCardProps) {
  const getColorClasses = (color: string) => {
    return {
      'primary': 'bg-primary/20 text-primary',
      'chart-1': 'bg-chart-1/20 text-chart-1',
      'chart-2': 'bg-chart-2/20 text-chart-2',
      'chart-3': 'bg-chart-3/20 text-chart-3',
      'chart-4': 'bg-chart-4/20 text-chart-4',
      'chart-5': 'bg-chart-5/20 text-chart-5',
    }[color] || 'bg-primary/20 text-primary';
  };

  const iconColorClass = getColorClasses(program.color).split(' ')[1];

  return (
    <Card 
      className={`bg-card transition-smooth cursor-pointer group ${
        isActive 
          ? 'border-primary/50' 
          : canStart 
            ? 'border-border hover:border-primary/50'
            : 'border-border opacity-75'
      }`}
      data-testid={`card-program-${program.code.toLowerCase()}`}
    >
      <CardContent className="p-6">
        <div className={`w-14 h-14 rounded-xl ${getColorClasses(program.color)} flex items-center justify-center mb-4 ${
          canStart ? 'group-hover:bg-opacity-30 transition-smooth' : ''
        }`}>
          <i className={`${program.icon} ${iconColorClass} text-2xl`}></i>
        </div>
        
        <h3 className="text-lg font-semibold text-foreground mb-2" data-testid={`text-program-title-${program.code.toLowerCase()}`}>
          {program.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4" data-testid={`text-program-description-${program.code.toLowerCase()}`}>
          {program.description}
        </p>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Badge variant="outline" className="text-xs">
            {program.type}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {program.duration}
          </Badge>
        </div>

        <Button
          onClick={onStart}
          disabled={!canStart || isLoading}
          className="w-full"
          variant={isActive ? "outline" : "default"}
          data-testid={`button-start-program-${program.code.toLowerCase()}`}
        >
          {isLoading ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Starting...
            </>
          ) : isActive ? (
            "Active Program"
          ) : canStart ? (
            "Start Program"
          ) : (
            "Upgrade Required"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
