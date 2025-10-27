import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Watch, Activity, Heart, Smartphone, Plus, X } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { WearableConnection } from '@shared/schema';

const DEVICE_TYPES = [
  { id: 'APPLE_WATCH', name: 'Apple Watch', icon: Watch, color: 'bg-gray-900' },
  { id: 'FITBIT', name: 'Fitbit', icon: Activity, color: 'bg-teal-600' },
  { id: 'OURA', name: 'Oura Ring', icon: Heart, color: 'bg-purple-600' },
  { id: 'SAMSUNG', name: 'Samsung Watch', icon: Watch, color: 'bg-blue-600' },
  { id: 'AMAZFIT', name: 'Amazfit', icon: Smartphone, color: 'bg-orange-600' },
  { id: 'XIAOMI', name: 'Xiaomi Band', icon: Activity, color: 'bg-red-600' },
];

export function WearableCard() {
  const { toast } = useToast();
  
  const { data: connections = [] } = useQuery<WearableConnection[]>({
    queryKey: ['/api/wearables'],
  });

  const connectMutation = useMutation({
    mutationFn: async (deviceType: string) => {
      const response = await apiRequest('POST', '/api/wearables/connect', { deviceType });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wearables'] });
      toast({
        title: 'Device Connected',
        description: 'Your wearable device has been connected successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to connect device',
        variant: 'destructive',
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await apiRequest('DELETE', `/api/wearables/${connectionId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wearables'] });
      toast({
        title: 'Device Disconnected',
        description: 'Your wearable device has been disconnected.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Disconnection Failed',
        description: error instanceof Error ? error.message : 'Failed to disconnect device',
        variant: 'destructive',
      });
    },
  });

  const connectedDevicesMap = new Map(
    connections
      .filter(c => c.isActive)
      .map(c => [c.deviceType, c.id])
  );

  const handleDeviceClick = (deviceId: string) => {
    const connectionId = connectedDevicesMap.get(deviceId);
    
    if (connectionId) {
      disconnectMutation.mutate(connectionId);
    } else {
      connectMutation.mutate(deviceId);
    }
  };

  return (
    <Card data-testid="card-wearables">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Activity className="h-5 w-5" />
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
            const isConnected = connectedDevicesMap.has(device.id);
            const isLoading = connectMutation.isPending || disconnectMutation.isPending;
            
            return (
              <button
                key={device.id}
                onClick={() => handleDeviceClick(device.id)}
                disabled={isLoading}
                className={`
                  relative p-4 rounded-lg border-2 transition-all
                  ${isConnected 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50 hover:bg-accent'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                data-testid={`button-connect-${device.id.toLowerCase()}`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`p-2 rounded-full ${device.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{device.name}</span>
                  {isConnected ? (
                    <Badge variant="default" className="text-xs bg-primary">
                      <X className="h-3 w-3 mr-1" />
                      Disconnect
                    </Badge>
                  ) : (
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
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-semibold mb-3 text-primary">Recent Data</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-card border border-border">
                <div className="text-xs text-muted-foreground">Heart Rate</div>
                <div className="text-lg font-semibold text-foreground">72 bpm</div>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <div className="text-xs text-muted-foreground">Sleep</div>
                <div className="text-lg font-semibold text-foreground">7.5 hrs</div>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <div className="text-xs text-muted-foreground">Steps</div>
                <div className="text-lg font-semibold text-foreground">8,421</div>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <div className="text-xs text-muted-foreground">HRV</div>
                <div className="text-lg font-semibold text-foreground">54 ms</div>
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
              No devices connected yet. Click any device above to connect.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
