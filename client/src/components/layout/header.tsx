import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  subtitle?: string;
  userName?: string;
}

export function Header({ title, subtitle, userName }: HeaderProps) {
  return (
    <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
          <img 
            src="/logo.png" 
            alt="AuraVerse AI Logo" 
            className="h-8 sm:h-10 md:h-12 w-auto flex-shrink-0"
            data-testid="header-logo"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-primary truncate" data-testid="header-title">{title}</h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-foreground mt-0.5 sm:mt-1 truncate hidden sm:block" data-testid="header-subtitle">
                {subtitle.includes("{userName}") && userName 
                  ? subtitle.replace("{userName}", userName)
                  : subtitle
                }
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
          {/* Search (keyboard shortcut: CMD+K) - Hidden on mobile */}
          <Button
            variant="outline"
            className="hidden lg:flex px-3 md:px-4 py-2 text-muted-foreground hover:border-primary transition-smooth items-center gap-2"
            data-testid="button-search"
          >
            <i className="fas fa-search text-sm"></i>
            <span className="text-sm">Search</span>
            <kbd className="ml-2 px-2 py-0.5 bg-muted text-xs rounded">⌘K</kbd>
          </Button>
          
          {/* Search icon only on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden p-2 rounded-lg hover:bg-accent transition-smooth"
            data-testid="button-search-mobile"
          >
            <i className="fas fa-search text-muted-foreground"></i>
          </Button>
          
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative p-2 rounded-lg hover:bg-accent transition-smooth"
            data-testid="button-notifications"
          >
            <i className="fas fa-bell text-muted-foreground text-sm sm:text-base"></i>
            <span className="absolute top-1 right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></span>
          </Button>
        </div>
      </div>
    </header>
  );
}
