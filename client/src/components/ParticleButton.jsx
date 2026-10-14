import { useState } from 'react';

const PARTICLE_COUNT = 8;

// Lightweight particle-burst effect for a button, no animation library needed —
// a handful of absolutely-positioned dots animated via CSS (see .particle-dot / @keyframes
// particle-burst in index.css), cleaned up after the animation finishes.
export function ParticleButton({ children, onClick, className = '', disabled, ...props }) {
  const [burst, setBurst] = useState(null);

  const handleClick = (e) => {
    onClick?.(e);
    if (disabled) return;
    setBurst(Date.now());
    setTimeout(() => setBurst(null), 600);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`relative transition-transform duration-100 ${burst ? 'scale-95' : ''} ${className}`}
      {...props}
    >
      {children}
      {burst && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
          {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
            <span key={burst + '-' + i} className="particle-dot"
              style={{ '--angle': `${(360 / PARTICLE_COUNT) * i}deg`, '--delay': `${i * 0.03}s` }} />
          ))}
        </span>
      )}
    </button>
  );
}
