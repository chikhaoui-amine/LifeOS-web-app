import React from 'react';
import { Goal } from '../../types';

interface LifeBalanceWheelProps {
  goals: Goal[];
  size?: number;
}

const CATEGORIES = [
  'Career & Business',
  'Financial',
  'Health & Fitness',
  'Relationships',
  'Personal Dev',
  'Fun & Rec', // Adventure/Hobbies
  'Spiritual',
  'Contribution'
];

export const LifeBalanceWheel: React.FC<LifeBalanceWheelProps> = ({ goals, size = 300 }) => {
  // 1. Calculate Score per Category (0-10)
  const scores = CATEGORIES.map(cat => {
    const catGoals = goals.filter(g => 
        (g.category.includes(cat) || (cat === 'Fun & Rec' && (g.category.includes('Adventure') || g.category.includes('Hobbies')))) && 
        g.status !== 'cancelled'
    );
    
    if (catGoals.length === 0) return 2; // Default baseline score
    
    const totalProgress = catGoals.reduce((acc, g) => acc + (g.currentValue / g.targetValue), 0);
    const avgProgress = totalProgress / catGoals.length;
    
    // Base score 3 + up to 7 based on average goal progress
    return 3 + (avgProgress * 7);
  });

  // 2. Geometry Helpers
  const center = size / 2;
  const radius = (size / 2) - 40; // Padding for text
  const angleStep = (Math.PI * 2) / CATEGORIES.length;

  const getPoint = (index: number, value: number) => {
    const angle = (index * angleStep) - (Math.PI / 2); // Start at top
    const r = (value / 10) * radius;
    const x = center + Math.cos(angle) * r;
    const y = center + Math.sin(angle) * r;
    return { x, y };
  };

  // 3. Build Polygon Points
  const points = scores.map((val, i) => {
    const p = getPoint(i, val);
    return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="overflow-visible">
          {/* Background Grid Webs */}
          {[2, 4, 6, 8, 10].map(level => (
            <polygon
              key={level}
              points={CATEGORIES.map((_, i) => {
                const p = getPoint(i, level);
                return `${p.x},${p.y}`;
              }).join(' ')}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.1"
              className="text-gray-400 dark:text-gray-600"
              strokeWidth="1"
            />
          ))}

          {/* Spokes */}
          {CATEGORIES.map((_, i) => {
            const p = getPoint(i, 10);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={p.x}
                y2={p.y}
                stroke="currentColor"
                strokeOpacity="0.1"
                className="text-gray-400 dark:text-gray-600"
                strokeWidth="1"
              />
            );
          })}

          {/* Data Polygon */}
          <polygon
            points={points}
            fill="rgba(99, 102, 241, 0.2)" // primary-500 with opacity
            stroke="#6366f1" // primary-500
            strokeWidth="2"
            className="drop-shadow-sm transition-all duration-1000 ease-out"
          />

          {/* Data Points */}
          {scores.map((val, i) => {
            const p = getPoint(i, val);
            return (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="4"
                fill="#6366f1"
                className="transition-all duration-1000 ease-out"
              />
            );
          })}

          {/* Labels */}
          {CATEGORIES.map((cat, i) => {
            const angle = (i * angleStep) - (Math.PI / 2);
            // Push text out a bit further than radius
            const labelR = radius + 25; 
            const x = center + Math.cos(angle) * labelR;
            const y = center + Math.sin(angle) * labelR;
            
            // Text Anchor logic based on position
            let anchor: "middle" | "start" | "end" = 'middle';
            if (x > center + 10) anchor = 'start';
            if (x < center - 10) anchor = 'end';

            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="text-[10px] font-medium fill-gray-500 dark:fill-gray-400 uppercase tracking-wide"
              >
                {cat.split(' ')[0]} {/* Abbreviate first word for space */}
              </text>
            );
          })}
        </svg>
      </div>
      <p className="text-xs text-gray-400 mt-2">Life Balance Score</p>
    </div>
  );
};