import React from 'react';

interface ProgressRingProps {
  radius?: number;
  stroke?: number;
  progress: number;
  color?: string;
  trackColor?: string;
  showValue?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({ 
  radius = 60, 
  stroke = 8, 
  progress,
  color = 'stroke-primary-600',
  trackColor = 'stroke-gray-200 dark:stroke-gray-700',
  showValue = true
}) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="rotate-[-90deg]"
      >
        <circle
          className={trackColor}
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          className={`${color} transition-all duration-1000 ease-out`}
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      {showValue && (
        <div className="absolute flex flex-col items-center justify-center text-gray-900 dark:text-white">
          <span className="text-2xl font-bold">{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  );
};