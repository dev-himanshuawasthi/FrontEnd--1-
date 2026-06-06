export function DecipherLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle */}
      <circle cx="100" cy="100" r="95" fill="none" stroke="url(#logoGradient)" strokeWidth="2" opacity="0.3" />
      
      {/* Main D shape with data visualization elements */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#00d9ff" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>

      {/* Network nodes - top left */}
      <circle cx="45" cy="35" r="3" fill="url(#accentGradient)" />
      <circle cx="60" cy="50" r="2.5" fill="url(#accentGradient)" opacity="0.8" />
      <circle cx="75" cy="40" r="2" fill="url(#accentGradient)" opacity="0.6" />
      <line x1="45" y1="35" x2="60" y2="50" stroke="url(#accentGradient)" strokeWidth="1.5" opacity="0.5" />
      <line x1="60" y1="50" x2="75" y2="40" stroke="url(#accentGradient)" strokeWidth="1.5" opacity="0.5" />

      {/* Bar chart - top right */}
      <rect x="130" y="30" width="8" height="35" fill="url(#accentGradient)" opacity="0.8" />
      <rect x="145" y="20" width="8" height="45" fill="url(#accentGradient)" opacity="0.9" />
      <rect x="160" y="35" width="8" height="30" fill="url(#accentGradient)" opacity="0.7" />

      {/* Upward arrow */}
      <line x1="155" y1="80" x2="155" y2="50" stroke="url(#accentGradient)" strokeWidth="2" />
      <polygon points="155,45 150,55 160,55" fill="url(#accentGradient)" />

      {/* Main D circle outline - left side */}
      <circle cx="80" cy="100" r="50" fill="none" stroke="url(#accentGradient)" strokeWidth="3" opacity="0.9" />

      {/* Inner circle - data core */}
      <circle cx="80" cy="100" r="28" fill="none" stroke="url(#accentGradient)" strokeWidth="2" opacity="0.6" />

      {/* Network pattern inside D */}
      <circle cx="60" cy="85" r="2" fill="url(#accentGradient)" opacity="0.7" />
      <circle cx="75" cy="95" r="2" fill="url(#accentGradient)" opacity="0.7" />
      <circle cx="95" cy="90" r="2" fill="url(#accentGradient)" opacity="0.7" />
      <circle cx="85" cy="115" r="2" fill="url(#accentGradient)" opacity="0.7" />
      <line x1="60" y1="85" x2="75" y2="95" stroke="url(#accentGradient)" strokeWidth="1" opacity="0.4" />
      <line x1="75" y1="95" x2="95" y2="90" stroke="url(#accentGradient)" strokeWidth="1" opacity="0.4" />
      <line x1="95" y1="90" x2="85" y2="115" stroke="url(#accentGradient)" strokeWidth="1" opacity="0.4" />

      {/* Binary text on right side */}
      <text x="145" y="135" fontSize="10" fontWeight="bold" fill="url(#accentGradient)" opacity="0.8">
        01001
      </text>

      {/* Bottom network nodes */}
      <circle cx="50" cy="160" r="2.5" fill="url(#accentGradient)" opacity="0.8" />
      <circle cx="70" cy="170" r="2" fill="url(#accentGradient)" opacity="0.6" />
      <circle cx="90" cy="165" r="2" fill="url(#accentGradient)" opacity="0.7" />
      <line x1="50" y1="160" x2="70" y2="170" stroke="url(#accentGradient)" strokeWidth="1.5" opacity="0.5" />
      <line x1="70" y1="170" x2="90" y2="165" stroke="url(#accentGradient)" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}
