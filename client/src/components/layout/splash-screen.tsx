import { useEffect, useState } from "react";
import logoImg from "@assets/auraverse-logo.png";

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export function SplashScreen({ onComplete, duration = 2500 }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, duration - 500);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      data-testid="splash-screen"
    >
      <div className="text-center space-y-8">
        {/* Animated Logo */}
        <div className="animate-fade-in-scale">
          <img
            src={logoImg}
            alt="AuraVerse AI"
            className="h-64 w-auto object-contain mx-auto gold-glow-hover animate-pulse-subtle"
            data-testid="logo-splash"
          />
        </div>

        {/* Tagline */}
        <div className="animate-fade-in-delayed">
          <h1 className="text-3xl font-bold text-primary mb-2">
            AuraVerse.ai
          </h1>
          <p className="text-lg text-muted-foreground uppercase tracking-wider">
            Where Minds Rise With Safe Intelligence
          </p>
        </div>

        {/* Loading Indicator */}
        <div className="flex justify-center pt-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
