import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { EISnapshot } from '@/types';

interface EIChartProps {
  data: EISnapshot[];
}

export function EIChart({ data }: EIChartProps) {
  const chartData = [...data].reverse().map(snapshot => ({
    date: new Date(snapshot.createdAt).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    score: snapshot.score,
    state: snapshot.state,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis 
          dataKey="date" 
          className="text-xs fill-muted-foreground"
          tick={{ fill: 'currentColor' }}
        />
        <YAxis 
          domain={[0, 100]}
          className="text-xs fill-muted-foreground"
          tick={{ fill: 'currentColor' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            color: 'hsl(var(--foreground))',
          }}
          formatter={(value: number, name: string) => {
            if (name === 'score') return [value, 'EI Score'];
            return [value, name];
          }}
        />
        <Line 
          type="monotone" 
          dataKey="score" 
          stroke="hsl(var(--primary))" 
          strokeWidth={2}
          dot={{ fill: 'hsl(var(--primary))', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
