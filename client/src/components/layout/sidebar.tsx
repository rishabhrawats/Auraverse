import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useTier } from "@/hooks/use-tier";
import { Crown } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "fas fa-chart-line" },
  { name: "AI Oracle", href: "/oracle", icon: "fas fa-magic" },
  { name: "Programs", href: "/programs", icon: "fas fa-brain" },
  { name: "Zen Mode", href: "/zen", icon: "fas fa-spa" },
  { name: "Journal", href: "/journal", icon: "fas fa-lock" },
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

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-primary">AuraVerse AI</h1>
        <p className="text-xs text-sidebar-foreground/70 mt-1">Build your legacy</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-smooth",
                  isActive
                    ? "nav-active text-sidebar-foreground bg-sidebar-accent"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <i className={`${item.icon} w-5 text-center`}></i>
                <span>{item.name}</span>
              </a>
            </Link>
          );
        })}

        <div className="my-4 border-t border-sidebar-border"></div>

        {secondaryNavigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-smooth",
                  isActive
                    ? "text-sidebar-foreground bg-sidebar-accent"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
                data-testid={`nav-${item.name.toLowerCase()}`}
              >
                <i className={`${item.icon} w-5 text-center`}></i>
                <span>{item.name}</span>
              </a>
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
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-smooth"
            data-testid="button-settings"
          >
            <i className="fas fa-cog"></i>
          </button>
        </div>
      </div>
    </aside>
  );
}
