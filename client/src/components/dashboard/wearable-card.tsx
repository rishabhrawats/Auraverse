import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Watch, Activity, Heart, Zap, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { WearableConnection } from '@shared/schema';

const DEVICE_TYPES = [
  { id: 'APPLE_WATCH', name: 'Apple Watch', icon: Watch, color: 'bg-gray-900' },
  { id: 'FITBIT', name: 'Fitbit', icon: Activity, color: 'bg-teal-600' },
  { id: 'OURA', name: 'Oura Ring', icon: Heart, color: 'bg-purple-600' },
  { id: 'WHOOP', name: 'WHOOP', icon: Zap, color: 'bg-red-600' },
  { id: 'GARMIN', name: 'Garmin', icon: Watch, color: 'bg-blue-600' },
];

export function WearableCard() {
  const { data: connections = [] } = useQuery<WearableConnection[]>({
    queryKey: ['/api/wearables'],
  });

  const connectedDevices = new Set(connections.filter(c => c.isActive).map(c => c.deviceType));

  return (
    <Card data-testid="card-wearables">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Wearable Devices
        </CardTitle>
        <CardDescription>
          Connect your wearable devices to track health metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {DEVICE_TYPES.map((device) => {
            const Icon = device.icon;
            const isConnected = connectedDevices.has(device.id);
            
            return (
              <button
                key={device.id}
                className={`
                  relative p-4 rounded-lg border-2 transition-all
                  ${isConnected 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50 hover:bg-accent'
                  }
                `}
                data-testid={`button-connect-${device.id.toLowerCase()}`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`p-2 rounded-full ${device.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">{device.name}</span>
                  {isConnected && (
                    <Badge variant="default" className="text-xs">Connected</Badge>
                  )}
                  {!isConnected && (
                    <Badge variant="outline" className="text-xs">
                      <Plus className="h-3 w-3 mr-1" />
                      Connect
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {connections.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-3">Recent Data</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-secondary">
                <div className="text-xs text-muted-foreground">Heart Rate</div>
                <div className="text-lg font-semibold">72 bpm</div>
              </div>
              <div className="p-3 rounded-lg bg-secondary">
                <div className="text-xs text-muted-foreground">Sleep</div>
                <div className="text-lg font-semibold">7.5 hrs</div>
              </div>
              <div className="p-3 rounded-lg bg-secondary">
                <div className="text-xs text-muted-foreground">Steps</div>
                <div className="text-lg font-semibold">8,421</div>
              </div>
              <div className="p-3 rounded-lg bg-secondary">
                <div className="text-xs text-muted-foreground">HRV</div>
                <div className="text-lg font-semibold">54 ms</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Syncing wearable data helps us provide more accurate mental wellness insights
            </p>
          </div>
        )}

        {connections.length === 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              No devices connected yet. Connect a wearable to get started.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
