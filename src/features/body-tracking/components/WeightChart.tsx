import type { ReactElement } from 'react';
import { chartModel, formatDelta, formatNumber, weightChange, type ChartBox, type WeightPoint } from '@/features/body-tracking/services/measurements';
import { formatDate } from '@/utils/formatDate';

const BOX: ChartBox = { width: 420, height: 190, left: 38, right: 16, top: 14, bottom: 28 };

interface WeightChartProps {
  points: WeightPoint[];
}

/** A light SVG line of the weight over time (no chart library). Time on x is proportional to the days between measurements. */
export function WeightChart({ points }: WeightChartProps): ReactElement | null {
  if (points.length === 0) return null;
  const model = chartModel(points, BOX);
  const change = weightChange(points);
  const first = model.dots[0];
  const last = model.dots[model.dots.length - 1];
  const summary = change
    ? `Peso de ${formatNumber(change.from)} a ${formatNumber(change.to)} kg en ${change.days} días`
    : `Una medición de peso: ${formatNumber(points[0].value)} kg`;
  return (
    <figure className="bt-chart">
      <figcaption>
        <strong>{formatNumber(last.value)} kg</strong>
        {change ? (
          <span className={`bt-delta ${change.delta < 0 ? 'down' : change.delta > 0 ? 'up' : ''}`}>
            {formatDelta(change.delta)} en {change.days} {change.days === 1 ? 'día' : 'días'}
          </span>
        ) : (
          <span className="muted">Con otra medición verás la evolución</span>
        )}
      </figcaption>
      <svg viewBox={`0 0 ${BOX.width} ${BOX.height}`} role="img" aria-label={summary} preserveAspectRatio="xMidYMid meet">
        {model.ticks.map((tick) => (
          <g key={tick.y}>
            <line x1={BOX.left} x2={BOX.width - BOX.right} y1={tick.y} y2={tick.y} className="bt-grid" />
            <text x={BOX.left - 8} y={tick.y + 4} textAnchor="end" className="bt-axis">
              {formatNumber(Number(tick.label))}
            </text>
          </g>
        ))}
        {model.dots.length > 1 && <path d={model.path} className="bt-line" />}
        {model.dots.map((dot) => (
          <circle key={dot.id} cx={dot.x} cy={dot.y} r={4.5} className="bt-dot" data-testid="weight-dot">
            <title>{`${formatDate(dot.date)}: ${formatNumber(dot.value)} kg`}</title>
          </circle>
        ))}
        <text x={first.x} y={BOX.height - 8} textAnchor={model.dots.length > 1 ? 'start' : 'middle'} className="bt-axis">
          {formatDate(first.date)}
        </text>
        {model.dots.length > 1 && (
          <text x={last.x} y={BOX.height - 8} textAnchor="end" className="bt-axis">
            {formatDate(last.date)}
          </text>
        )}
      </svg>
    </figure>
  );
}
