import { Button } from "@/components/ui/button";
import logoImg from "@assets/auraverse-logo.png";

interface HeaderProps {
  title: string;
  subtitle?: string;
  userName?: string;
}

export function Header({ title, subtitle, userName }: HeaderProps) {
  return (
    <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img 
            src={logoImg} 
            alt="AuraVerse AI Logo" 
            className="h-12 w-auto object-contain"
            data-testid="logo-header"
          />
          <div>
            <h2 className="text-2xl font-bold text-primary" data-testid="header-title">{title}</h2>
            {subtitle && (
              <p className="text-sm text-foreground mt-1" data-testid="header-subtitle">
                {subtitle.includes("{userName}") && userName 
                  ? subtitle.replace("{userName}", userName)
                  : subtitle
                }
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Search (keyboard shortcut: CMD+K) */}
          <Button
            variant="outline"
            className="px-4 py-2 text-muted-foreground hover:border-primary transition-smooth flex items-center gap-2"
            data-testid="button-search"
          >
            <i className="fas fa-search"></i>
            <span className="text-sm">Search</span>
            <kbd className="ml-2 px-2 py-0.5 bg-muted text-xs rounded">⌘K</kbd>
          </Button>
          
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative p-2 rounded-lg hover:bg-accent transition-smooth"
            data-testid="button-notifications"
          >
            <i className="fas fa-bell text-muted-foreground"></i>
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
          </Button>
        </div>
      </div>
    </header>
  );
}
