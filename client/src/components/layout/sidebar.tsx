import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useTier } from "@/hooks/use-tier";
import { useAuth } from "@/hooks/use-auth";
import { Crown, LogOut } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "fas fa-chart-line" },
  { name: "AI Oracle", href: "/oracle", icon: "fas fa-magic" },
  { name: "Programs", href: "/programs", icon: "fas fa-brain" },
  { name: "Zen Mode", href: "/zen", icon: "fas fa-spa" },
  { name: "Journal", href: "/journal", icon: "fas fa-lock" },
  { name: "Media Analysis", href: "/media-analysis", icon: "fas fa-microphone" },
  { name: "Insights", href: "/insights", icon: "fas fa-chart-bar" },
];

const secondaryNavigation = [
  { name: "Billing", href: "/billing", icon: "fas fa-credit-card" },
  { name: "Privacy", href: "/privacy", icon: "fas fa-shield-alt" },
];

interface SidebarProps {
  user?: {
    name: string;
    email: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const [location] = useLocation();
  const { tierName, tierPrice, tier } = useTier();
  const { signOut } = useAuth();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:flex left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex-col z-50">
        {/* Logo */}
        <div className="p-4 xl:p-6 border-b border-sidebar-border flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="AuraVerse AI Logo" 
            className="h-10 w-auto"
          />
          <div className="min-w-0">
            <h1 className="text-lg xl:text-xl font-bold text-sidebar-primary truncate">AuraVerse AI</h1>
            <p className="text-xs text-sidebar-foreground/70 mt-0.5">Build your legacy</p>
          </div>
        </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-smooth cursor-pointer",
                  isActive
                    ? "nav-active text-sidebar-foreground bg-sidebar-accent"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <i className={`${item.icon} w-5 text-center`}></i>
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}

        <div className="my-4 border-t border-sidebar-border"></div>

        {secondaryNavigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-smooth cursor-pointer",
                  isActive
                    ? "text-sidebar-foreground bg-sidebar-accent"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
                data-testid={`nav-${item.name.toLowerCase()}`}
              >
                <i className={`${item.icon} w-5 text-center`}></i>
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-sidebar-accent">
          <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-semibold">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate" data-testid="user-name">
              {user?.name || "User"}
            </p>
            <div className="flex items-center gap-1 text-xs text-sidebar-foreground/70">
              {tier === 'EXCLUSIVE_99' && <Crown className="w-3 h-3 text-yellow-500" />}
              <span data-testid="user-tier">{tierName} Plan</span>
            </div>
          </div>
          <button 
            onClick={signOut}
            className="text-sidebar-foreground/70 hover:text-red-500 transition-smooth"
            data-testid="button-logout"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border z-50 pb-safe" data-testid="mobile-bottom-nav">
        <div className="grid grid-cols-7 gap-0 px-1 py-2">
          {navigation.map((item) => {
            const isActive = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg text-xs font-medium transition-smooth cursor-pointer",
                    isActive
                      ? "text-sidebar-primary bg-sidebar-accent"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                  data-testid={`nav-mobile-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <i className={`${item.icon} text-sm`}></i>
                  <span className="text-[9px] truncate max-w-[50px] leading-tight text-center">{item.name === 'Media Analysis' ? 'Media' : item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
