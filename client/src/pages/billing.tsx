import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Subscription } from "@/types";

const PLAN_FEATURES = {
  STARTER_5: [
    "Journaling (encrypted)",
    "Zen Mode",
    "Calendar blocking", 
    "Weekly EI compute",
    "1 active program"
  ],
  PRO_99: [
    "All Starter features",
    "Daily EI computation",
    "Insights correlation", 
    "Multi-program support",
    "Weekly PDF digest",
    "Advanced AI prompts",
    "Priority support"
  ]
};

export default function Billing() {
  const { toast } = useToast();

  // Fetch user data including subscription
  const { data: userData, isLoading } = useQuery({
    queryKey: ["/api/me"],
  });

  // Create checkout session mutation
  const checkoutMutation = useMutation({
    mutationFn: async (planType: 'STARTER_5' | 'PRO_99') => {
      const response = await apiRequest("POST", "/api/billing/checkout", { planType });
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      window.location.href = data.sessionUrl;
    },
    onError: (error) => {
      toast({
        title: "Checkout Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const currentSubscription = userData?.subscription as Subscription | undefined;
  const currentPlan = currentSubscription?.planType;
  const isActive = currentSubscription?.status === 'ACTIVE';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (planType: string) => {
    switch (planType) {
      case 'STARTER_5': return '$5';
      case 'PRO_99': return '$99';
      default: return '$0';
    }
  };

  const getPlanName = (planType: string) => {
    switch (planType) {
      case 'STARTER_5': return 'Starter';
      case 'PRO_99': return 'Pro';
      default: return 'Free';
    }
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
        title="Billing & Subscription" 
        subtitle="Manage your plan and payment methods"
      />
      
      <div className="max-w-4xl mx-auto px-8 py-8 space-y-8">
        {/* Current Plan */}
        {currentSubscription && isActive && (
          <Card className="bg-card border-primary/50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-foreground" data-testid="text-current-plan-name">
                      {getPlanName(currentPlan || '')} Plan
                    </h3>
                    <Badge className="bg-primary/20 text-primary" data-testid="badge-plan-status">
                      ACTIVE
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-current-plan-price">
                    {formatPrice(currentPlan || '')}
                    <span className="text-base font-normal text-muted-foreground">/month</span>
                  </p>
                </div>
                <Button 
                  variant="outline"
                  data-testid="button-change-plan"
                >
                  Change Plan
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Billing cycle</p>
                  <p className="text-sm font-medium text-foreground">Monthly</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Next billing date</p>
                  <p className="text-sm font-medium text-foreground" data-testid="text-next-billing">
                    {formatDate(currentSubscription.currentPeriodEnd)}
                  </p>
                </div>
              </div>

              {/* Current Plan Features */}
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-medium text-foreground mb-3">
                  {getPlanName(currentPlan || '')} Features
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {PLAN_FEATURES[currentPlan as keyof typeof PLAN_FEATURES]?.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <i className="fas fa-check text-chart-2 text-xs"></i>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan Comparison */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Available Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Starter Plan */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-foreground mb-2" data-testid="text-starter-title">
                  Starter
                </h4>
                <p className="text-3xl font-bold text-foreground mb-4" data-testid="text-starter-price">
                  $5<span className="text-base font-normal text-muted-foreground">/month</span>
                </p>
                
                <ul className="space-y-2 mb-6">
                  {PLAN_FEATURES.STARTER_5.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <i className="fas fa-check text-chart-2 text-xs"></i>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => checkoutMutation.mutate('STARTER_5')}
                  disabled={currentPlan === 'STARTER_5' || checkoutMutation.isPending}
                  className="w-full"
                  variant={currentPlan === 'STARTER_5' ? 'outline' : 'default'}
                  data-testid="button-starter-plan"
                >
                  {checkoutMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Loading...
                    </>
                  ) : currentPlan === 'STARTER_5' ? (
                    'Current Plan'
                  ) : (
                    'Choose Starter'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className={`bg-card relative ${
              currentPlan === 'PRO_99' ? 'border-2 border-primary' : 'border-border'
            }`}>
              {currentPlan === 'PRO_99' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">CURRENT</Badge>
                </div>
              )}
              
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-foreground mb-2" data-testid="text-pro-title">
                  Pro
                </h4>
                <p className="text-3xl font-bold text-foreground mb-4" data-testid="text-pro-price">
                  $99<span className="text-base font-normal text-muted-foreground">/month</span>
                </p>
                
                <ul className="space-y-2 mb-6">
                  {PLAN_FEATURES.PRO_99.map((feature, index) => (
                    <li key={index} className={`flex items-center gap-2 text-sm ${
                      feature === 'All Starter features' ? 'text-foreground font-medium' : 'text-muted-foreground'
                    }`}>
                      <i className={`fas fa-check text-xs ${
                        feature === 'All Starter features' ? 'text-primary' : 'text-chart-2'
                      }`}></i>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => checkoutMutation.mutate('PRO_99')}
                  disabled={currentPlan === 'PRO_99' || checkoutMutation.isPending}
                  className="w-full"
                  variant={currentPlan === 'PRO_99' ? 'outline' : 'default'}
                  data-testid="button-pro-plan"
                >
                  {checkoutMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Loading...
                    </>
                  ) : currentPlan === 'PRO_99' ? (
                    'Current Plan'
                  ) : (
                    'Choose Pro'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Payment Method (Placeholder) */}
        {currentSubscription && isActive && (
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Payment Method</h3>
              
              <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-primary/20 rounded flex items-center justify-center">
                    <i className="fab fa-cc-visa text-primary text-xl"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground" data-testid="text-payment-method">
                      •••• •••• •••• 4242
                    </p>
                    <p className="text-xs text-muted-foreground">Managed by Stripe</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  data-testid="button-update-payment"
                >
                  Update
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Subscription State */}
        {!currentSubscription && (
          <Card className="bg-muted/5 border border-muted">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-credit-card text-2xl text-muted-foreground"></i>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Active Subscription</h3>
              <p className="text-muted-foreground mb-6">
                Choose a plan to unlock AuraVerse's full potential and start building your legacy.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => checkoutMutation.mutate('STARTER_5')}
                  disabled={checkoutMutation.isPending}
                  variant="outline"
                  data-testid="button-get-starter"
                >
                  Get Starter - $5/mo
                </Button>
                <Button
                  onClick={() => checkoutMutation.mutate('PRO_99')}
                  disabled={checkoutMutation.isPending}
                  data-testid="button-get-pro"
                >
                  Get Pro - $99/mo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing Information */}
        <Card className="bg-primary/5 border border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <i className="fas fa-info-circle text-primary text-xl mt-1"></i>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Billing Information</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Monthly billing:</strong> All plans are billed monthly. 
                    You can upgrade, downgrade, or cancel at any time.
                  </p>
                  <p>
                    <strong className="text-foreground">Secure payments:</strong> All payments are processed 
                    securely through Stripe. We never store your payment information.
                  </p>
                  <p>
                    <strong className="text-foreground">No long-term contracts:</strong> AuraVerse is designed 
                    for individuals, not companies. Cancel anytime with no penalties.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
