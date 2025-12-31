
import React, { useState } from 'react';

// --- Line Chart ---
interface LineChartProps {
  data: number[];
  labels: string[];
  color?: string;
  height?: number;
}

export const LineChart: React.FC<LineChartProps> = ({ data, labels, color = '#6366f1', height = 200 }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  
  if (data.length < 2) return null;

  const max = Math.max(...data, 100); // Ensure at least 100% scale
  const min = 0;
  const padding = 20;
  const width = 1000; // Internal SVG coordinate width
  const chartHeight = 300; // Internal SVG coordinate height
  
  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = chartHeight - padding - ((val - min) / (max - min)) * (chartHeight - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${padding},${chartHeight - padding} ${points} ${width - padding},${chartHeight - padding}`;

  return (
    <div className="w-full relative" style={{ height }}>
      <svg viewBox={`0 0 ${width} ${chartHeight}`} className="w-full h-full overflow-visible">
        {/* Gradients */}
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="currentColor" strokeOpacity="0.1" className="text-gray-400" />
        <line x1={padding} y1={chartHeight / 2} x2={width - padding} y2={chartHeight / 2} stroke="currentColor" strokeOpacity="0.1" className="text-gray-400" />
        <line x1={padding} y1={chartHeight - padding} x2={width - padding} y2={chartHeight - padding} stroke="currentColor" strokeOpacity="0.1" className="text-gray-400" />

        {/* Area */}
        <polygon points={areaPoints} fill={`url(#gradient-${color})`} />

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points & Interactivity */}
        {data.map((val, i) => {
          const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
          const y = chartHeight - padding - ((val - min) / (max - min)) * (chartHeight - 2 * padding);
          
          return (
            <g key={i} onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
              <circle
                cx={x}
                cy={y}
                r={hoverIndex === i ? 8 : 0}
                fill={color}
                className="transition-all duration-200"
              />
              {/* Invisible larger hit target */}
              <circle cx={x} cy={y} r="20" fill="transparent" cursor="pointer" />
              
              {/* Tooltip Label (Always show first and last, others on hover) */}
              {(i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 5) === 0) && (
                <text 
                  x={x} 
                  y={chartHeight} 
                  textAnchor="middle" 
                  className="text-xs fill-gray-400 dark:fill-gray-500" 
                  fontSize="14"
                >
                  {labels[i]}
                </text>
              )}

              {hoverIndex === i && (
                 <g>
                    <rect x={x - 25} y={y - 40} width="50" height="25" rx="4" fill="#1f2937" />
                    <text x={x} y={y - 23} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{val}%</text>
                 </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};


// --- Bar Chart ---
interface BarChartProps {
  data: { label: string; value: number; color: string; payload?: any }[];
  height?: number;
  onSelect?: (payload: any, index: number) => void;
  goalValue?: number;
}

export const BarChart: React.FC<BarChartProps> = ({ data, height = 200, onSelect, goalValue }) => {
  if (data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), goalValue || 0, 1);

  return (
    <div className="w-full relative flex items-end justify-between gap-2" style={{ height }}>
      {/* Optional Goal Line */}
      {goalValue && (
         <div 
           className="absolute left-0 right-0 border-t border-dashed border-gray-400/20 z-0 pointer-events-none"
           style={{ bottom: `${(goalValue / max) * 100}%` }}
         >
            <span className="absolute right-0 -top-4 text-[8px] font-black text-gray-400 uppercase tracking-widest bg-white dark:bg-slate-900 px-1">Goal</span>
         </div>
      )}

      {data.map((item, i) => {
        const percent = (item.value / max) * 100;
        const isSelected = item.payload?.isSelected;

        return (
          <div 
            key={i} 
            className="flex-1 flex flex-col items-center group cursor-pointer z-10"
            onClick={() => onSelect?.(item.payload, i)}
          >
            <div className="relative w-full flex items-end justify-center h-full">
              {/* Hit target / Ghost bar */}
              <div className={`absolute inset-x-0 bottom-0 top-0 rounded-t-xl transition-all ${isSelected ? 'bg-indigo-500/5' : 'group-hover:bg-gray-100/50 dark:group-hover:bg-gray-800/30'}`} />
              
              <div 
                className="w-full max-w-[32px] rounded-t-lg transition-all duration-700 ease-out shadow-sm relative z-10"
                style={{ 
                  height: `${Math.max(2, percent)}%`, 
                  backgroundColor: item.color,
                  opacity: percent === 0 ? 0.2 : 1
                }}
              >
                 <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-xl pointer-events-none">
                    {item.value}h
                 </div>
              </div>
            </div>
            <span className={`text-[10px] font-black mt-3 truncate w-full text-center max-w-[60px] transition-colors uppercase tracking-tight ${isSelected ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-600'}`} title={item.label}>
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};


// --- Donut Chart ---
interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  showCenterText?: boolean;
}

export const DonutChart: React.FC<DonutChartProps> = ({ data, size = 160, thickness = 20, showCenterText = true }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  let currentAngle = 0;

  if (total === 0) return (
    <div className="flex items-center justify-center text-gray-400 text-sm" style={{ height: size }}>
       No data
    </div>
  );

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 42 42" className="transform -rotate-90">
        {data.map((item, i) => {
          const percentage = (item.value / total) * 100;
          const dashLength = percentage; // In SVG coordinate space approx (percent of 100)
          const gapLength = 100 - percentage;
          
          // Using standard dasharray trick for donut segments
          // 42 / 2 / PI approx 15.9155 radius for circumference 100
          
          const segment = (
            <circle
              key={i}
              cx="21"
              cy="21"
              r="15.91549430918954"
              fill="transparent"
              stroke={item.color}
              strokeWidth={thickness / 4} // scale relative to viewBox
              strokeDasharray={`${dashLength} ${gapLength}`}
              strokeDashoffset={-currentAngle}
              className="transition-all duration-500 hover:opacity-80 cursor-pointer"
            >
              <title>{item.label}: {Math.round(percentage)}%</title>
            </circle>
          );
          currentAngle += percentage;
          return segment;
        })}
      </svg>
      
      {showCenterText && (
        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
          <span className="text-2xl font-bold text-gray-800 dark:text-white">{total}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wide">Items</span>
        </div>
      )}
    </div>
  );
};
