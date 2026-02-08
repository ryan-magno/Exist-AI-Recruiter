interface MatchScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export function MatchScoreRing({ score, size = 40, strokeWidth = 4 }: MatchScoreRingProps) {
  if (score == null || isNaN(score)) return null;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getStrokeColor = () => {
    if (score >= 70) return 'hsl(142 71% 45%)';
    if (score >= 50) return 'hsl(38 92% 50%)';
    return 'hsl(0 84% 60%)';
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(214 32% 91%)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={getStrokeColor()}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dy="0.35em"
        className="text-xs font-bold fill-foreground"
      >
        {score}
      </text>
    </svg>
  );
}
