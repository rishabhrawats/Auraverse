import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Privacy() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [exportLoading, setExportLoading] = useState(false);

  // Privacy settings state (mock for now)
  const [settings, setSettings] = useState({
    aiSummaries: true,
    calendarNotifications: true,
    usageAnalytics: false,
  });

  // Export data mutation
  const exportDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/privacy/export", {});
      return response.json();
    },
    onSuccess: (data) => {
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auraverse-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "Your data has been exported and downloaded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteAccount = () => {
    const confirmation = prompt(
      'Are you sure you want to delete your account? This action cannot be undone.\n\nType "DELETE" to confirm:'
    );
    
    if (confirmation === 'DELETE') {
      toast({
        title: "Account Deletion",
        description: "Account deletion functionality would be implemented here.",
        variant: "destructive",
      });
      // In a real app, this would call the delete API and sign out the user
      // signOut();
    }
  };

  const consentEvents = [
    {
      event: "Data Processing Consent",
      date: "Jan 1, 2025",
      description: "Consented to processing EI metrics and calendar data",
      icon: "fas fa-check",
      color: "primary"
    },
    {
      event: "Google Calendar Integration",
      date: "Jan 2, 2025", 
      description: "Authorized read/write access to Google Calendar",
      icon: "fas fa-check",
      color: "chart-2"
    },
    {
      event: "AI Summary Generation",
      date: "Jan 5, 2025",
      description: "Opted in to AI-generated journal summaries",
      icon: "fas fa-check", 
      color: "chart-3"
    }
  ];

  return (
    <>
      <Header 
        title="Privacy Center" 
        subtitle="Control your data and privacy settings"
      />
      
      <div className="max-w-4xl mx-auto px-8 py-8 space-y-8">
        {/* Data Encryption Status */}
        <Card className="bg-card border-primary/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-shield-alt text-primary text-xl"></i>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="text-encryption-title">
                  Your Data is Protected
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  All journal entries are encrypted client-side using AES-GCM before transmission. 
                  We never have access to your unencrypted content.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-accent rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Encryption</p>
                    <p className="text-sm font-medium text-foreground" data-testid="text-encryption-method">
                      AES-256-GCM
                    </p>
                  </div>
                  <div className="bg-accent rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Key Derivation</p>
                    <p className="text-sm font-medium text-foreground" data-testid="text-key-derivation">
                      PBKDF2
                    </p>
                  </div>
                  <div className="bg-accent rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Storage</p>
                    <p className="text-sm font-medium text-foreground" data-testid="text-storage-method">
                      Encrypted Blobs
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consent Timeline */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4" data-testid="text-consent-timeline">
              Consent Timeline
            </h3>
            
            <div className="space-y-4">
              {consentEvents.map((event, index) => (
                <div key={index} className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                  <div className={`w-10 h-10 rounded-full bg-${event.color}/20 flex items-center justify-center flex-shrink-0`}>
                    <i className={`${event.icon} text-${event.color} text-sm`}></i>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-foreground" data-testid={`text-consent-event-${index}`}>
                        {event.event}
                      </h4>
                      <span className="text-xs text-muted-foreground" data-testid={`text-consent-date-${index}`}>
                        {event.date}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground" data-testid={`text-consent-description-${index}`}>
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4" data-testid="text-data-management">
              Data Management
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                <div className="flex items-center gap-3">
                  <i className="fas fa-download text-primary text-lg"></i>
                  <div>
                    <p className="text-sm font-medium text-foreground">Export Your Data</p>
                    <p className="text-xs text-muted-foreground">Download all your data in JSON format</p>
                  </div>
                </div>
                <Button 
                  onClick={() => exportDataMutation.mutate()}
                  disabled={exportDataMutation.isPending}
                  data-testid="button-export-data"
                >
                  {exportDataMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Exporting...
                    </>
                  ) : (
                    "Export"
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                <div className="flex items-center gap-3">
                  <i className="fas fa-user-times text-destructive text-lg"></i>
                  <div>
                    <p className="text-sm font-medium text-foreground">Delete Account</p>
                    <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
                  </div>
                </div>
                <Button 
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  data-testid="button-delete-account"
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4" data-testid="text-privacy-settings">
              Privacy Settings
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">AI Journal Summaries</p>
                  <p className="text-xs text-muted-foreground">Allow AI to generate summaries of your entries</p>
                </div>
                <Switch
                  checked={settings.aiSummaries}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, aiSummaries: checked }))}
                  data-testid="switch-ai-summaries"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Calendar Push Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive updates when calendar events change</p>
                </div>
                <Switch
                  checked={settings.calendarNotifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, calendarNotifications: checked }))}
                  data-testid="switch-calendar-notifications"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Anonymous Usage Analytics</p>
                  <p className="text-xs text-muted-foreground">Help improve AuraVerse with anonymized data</p>
                </div>
                <Switch
                  checked={settings.usageAnalytics}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, usageAnalytics: checked }))}
                  data-testid="switch-usage-analytics"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Crisis Resources */}
        <Card className="bg-destructive/10 border border-destructive/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <i className="fas fa-phone text-destructive text-xl mt-1"></i>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="text-crisis-resources">
                  Crisis Resources
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  If you're experiencing a crisis, please reach out for immediate help:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">National Suicide Prevention Lifeline:</span>
                    <a 
                      href="tel:988" 
                      className="text-sm text-primary hover:text-primary/80 transition-smooth"
                      data-testid="link-suicide-prevention"
                    >
                      988
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">Crisis Text Line:</span>
                    <a 
                      href="sms:741741" 
                      className="text-sm text-primary hover:text-primary/80 transition-smooth"
                      data-testid="link-crisis-text"
                    >
                      Text HOME to 741741
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">International:</span>
                    <a 
                      href="https://findahelpline.com" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:text-primary/80 transition-smooth"
                      data-testid="link-international-help"
                    >
                      findahelpline.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Processing Information */}
        <Card className="bg-muted/5 border border-muted">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Data Processing & Storage</h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div>
                <h4 className="font-medium text-foreground mb-2">What We Collect</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Profile information (venture stage, stressors, archetype)</li>
                  <li>Encrypted journal entries (we cannot read the content)</li>
                  <li>Effectiveness Index scores and trends</li>
                  <li>Program participation and completion data</li>
                  <li>Calendar metadata for workload analysis (with your consent)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground mb-2">How We Use Your Data</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Generate personalized AI coaching programs</li>
                  <li>Compute your Effectiveness Index and insights</li>
                  <li>Correlate calendar workload with effectiveness patterns</li>
                  <li>Improve our algorithms and user experience (anonymized)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">Data Retention</h4>
                <p>
                  Your data is retained as long as your account is active. When you delete your account, 
                  all personal data is permanently removed within 30 days. Anonymous analytics may be 
                  retained for service improvement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
