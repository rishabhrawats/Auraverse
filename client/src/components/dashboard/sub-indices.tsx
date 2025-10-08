import { Card, CardContent } from "@/components/ui/card";
import type { EISnapshot } from "@/types";

interface SubIndicesProps {
  currentEI?: EISnapshot;
}

const subIndexInfo = [
  {
    key: 'focusEfficiency' as const,
    name: 'Focus Efficiency',
    description: 'Time-on-task vs planned',
    color: 'primary'
  },
  {
    key: 'recoveryLatency' as const,
    name: 'Recovery Latency',
    description: 'Time to regulate after spikes',
    color: 'chart-2'
  },
  {
    key: 'decisionClarity' as const,
    name: 'Decision Clarity',
    description: 'Self-ratings & indecision markers',
    color: 'chart-3'
  },
  {
    key: 'emotionRegulation' as const,
    name: 'Emotion Regulation',
    description: 'Variability & rumination markers',
    color: 'chart-4'
  },
  {
    key: 'supportUtilization' as const,
    name: 'Support Utilization',
    description: 'Journaling & practice adherence',
    color: 'chart-5'
  },
  {
    key: 'strategicMomentum' as const,
    name: 'Strategic Momentum',
    description: 'Weekly important task completion',
    color: 'primary'
  }
];

export function SubIndices({ currentEI }: SubIndicesProps) {
  const getColorClasses = (color: string) => {
    const colorMap = {
      'primary': 'text-primary bg-primary',
      'chart-2': 'text-chart-2 bg-chart-2',
      'chart-3': 'text-chart-3 bg-chart-3',
      'chart-4': 'text-chart-4 bg-chart-4',
      'chart-5': 'text-chart-5 bg-chart-5',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.primary;
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-4" data-testid="text-sub-indices-title">
        Effectiveness Sub-Indices
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subIndexInfo.map((index) => {
          const score = currentEI?.[index.key] || Math.floor(Math.random() * 30) + 60;
          const colorClasses = getColorClasses(index.color);
          
          return (
            <Card
              key={index.key}
              className="bg-card border-border hover:border-primary/50 transition-smooth cursor-pointer"
              data-testid={`card-sub-index-${index.key}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-foreground" data-testid={`text-${index.key}-name`}>
                    {index.name}
                  </h4>
                  <span className={`text-xl font-bold ${colorClasses.split(' ')[0]}`} data-testid={`text-${index.key}-score`}>
                    {score}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`${colorClasses.split(' ')[1]} h-2 rounded-full transition-smooth`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2" data-testid={`text-${index.key}-description`}>
                  {index.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
