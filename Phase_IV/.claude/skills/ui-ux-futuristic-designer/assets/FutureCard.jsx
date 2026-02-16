// FutureCard.jsx - A template for futuristic glassmorphism cards
import React from 'react';

const FutureCard = ({
  title,
  subtitle,
  children,
  variant = "default",
  size = "md",
  glowColor = "cyan"
}) => {
  const variants = {
    default: "bg-gradient-to-br from-gray-900 to-gray-800/50",
    elevated: "bg-gradient-to-br from-gray-800/30 to-gray-900/20",
    transparent: "bg-white/5"
  };

  const sizes = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8"
  };

  const glowColors = {
    cyan: "shadow-cyan-400/20",
    purple: "shadow-purple-400/20",
    emerald: "shadow-emerald-400/20",
    pink: "shadow-pink-400/20"
  };

  return (
    <div className={`
      relative overflow-hidden rounded-2xl
      ${variants[variant]}
      ${sizes[size]}
      border border-white/10
      backdrop-blur-sm
      shadow-lg ${glowColors[glowColor]}
      transition-all duration-300
      hover:shadow-xl hover:scale-[1.02]
    `}>
      {/* Background glow effect */}
      <div className={`
        absolute inset-0 opacity-30
        bg-gradient-to-br
        from-${glowColor}-400/5
        to-transparent
        rounded-2xl
      `}></div>

      <div className="relative z-10">
        {title && (
          <h3 className="text-lg font-bold text-white mb-1">
            {title}
          </h3>
        )}

        {subtitle && (
          <p className="text-sm text-gray-400 mb-4">
            {subtitle}
          </p>
        )}

        <div className="text-gray-300">
          {children}
        </div>
      </div>
    </div>
  );
};

export default FutureCard;