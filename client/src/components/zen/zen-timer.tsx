interface ZenTimerProps {
  isActive: boolean;
  breathingPhase: 'inhale' | 'hold' | 'exhale' | 'pause';
}

export function ZenTimer({ isActive, breathingPhase }: ZenTimerProps) {
  const getScaleForPhase = (phase: string) => {
    switch (phase) {
      case 'inhale': return 'scale-110';
      case 'hold': return 'scale-110';
      case 'exhale': return 'scale-90';
      case 'pause': return 'scale-90';
      default: return 'scale-100';
    }
  };

  const getOpacityForPhase = (phase: string) => {
    switch (phase) {
      case 'inhale': return 'opacity-70';
      case 'hold': return 'opacity-70';
      case 'exhale': return 'opacity-40';
      case 'pause': return 'opacity-40';
      default: return 'opacity-50';
    }
  };

  return (
    <div className="relative w-64 h-64" data-testid="zen-breathing-circle">
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
      
      {/* Breathing circle */}
      <div 
        className={`absolute inset-8 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-1000 ease-in-out ${
          isActive ? getScaleForPhase(breathingPhase) : 'scale-100'
        } ${
          isActive ? getOpacityForPhase(breathingPhase) : 'opacity-40'
        }`}
      >
        <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center">
          <i className="fas fa-spa text-primary text-4xl"></i>
        </div>
      </div>

      {/* Pulsing indicator dots */}
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          className={`absolute w-3 h-3 rounded-full bg-primary transition-all duration-1000 ${
            isActive ? 'opacity-60' : 'opacity-20'
          }`}
          style={{
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) rotate(${index * 90}deg) translateY(-130px)`,
            animationDelay: `${index * 0.25}s`,
          }}
        />
      ))}
    </div>
  );
}
