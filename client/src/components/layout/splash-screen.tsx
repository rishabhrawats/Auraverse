import { useEffect, useState } from "react";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500 px-4 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      data-testid="splash-screen"
    >
      <div className="relative">
        <img 
          src="/logo.png" 
          alt="AuraVerse AI Logo" 
          className="h-40 sm:h-48 md:h-56 lg:h-64 w-auto animate-[fadeInScale_1s_ease-in-out] purple-glow"
          data-testid="splash-logo"
        />
      </div>
      
      <div className="mt-8 sm:mt-10 md:mt-12 flex items-center gap-2">
        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
      </div>
    </div>
  );
}
