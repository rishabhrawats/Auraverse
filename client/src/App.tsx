import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

// Pages
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Onboarding from "@/pages/onboarding";
import Programs from "@/pages/programs";
import ZenMode from "@/pages/zen";
import Journal from "@/pages/journal";
import Oracle from "@/pages/oracle";
import Insights from "@/pages/insights";
import Billing from "@/pages/billing";
import Privacy from "@/pages/privacy";
import SignIn from "@/components/auth/sign-in";
import SignUp from "@/components/auth/sign-up";
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar user={user || undefined} />
      <main className="ml-64 min-h-screen">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/programs" component={Programs} />
          <Route path="/zen" component={ZenMode} />
          <Route path="/journal" component={Journal} />
          <Route path="/oracle" component={Oracle} />
          <Route path="/insights" component={Insights} />
          <Route path="/billing" component={Billing} />
          <Route path="/privacy" component={Privacy} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function UnauthenticatedApp() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/signup" component={SignUp} />
        <Route path="/signin" component={SignIn} />
        <Route component={Landing} />
      </Switch>
    </div>
  );
}

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {isAuthenticated ? <AuthenticatedApp /> : <UnauthenticatedApp />}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
