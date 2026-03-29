import { useCityWatchStore } from '../../store/gameStore';
import { getDistrictVisualStatus } from '../../store/selectors';
import type { MapOverlayMode } from '../../types';
import { INITIAL_DISTRICTS } from '../../data/cityData';

const OVERLAY_LABELS: Record<MapOverlayMode, string> = {
  panic: 'Panic',
  trust: 'Trust',
  incidents: 'Incidents',
  cameras: 'Cameras',
  responders: 'Responders',
};

import type { GameState } from '../../types';

function getOverlayColor(mode: MapOverlayMode, districtId: string, game: GameState): string {
  const district = game.city.districtsById[districtId];
  if (!district) return '#1a2030';

  switch (mode) {
    case 'panic': {
      const p = district.panic / 100;
      const r = Math.round(30 + p * 170);
      const g = Math.round(60 - p * 50);
      const b = Math.round(20);
      return `rgb(${r},${g},${b})`;
    }
    case 'trust': {
      const t = district.trust / 100;
      const r = Math.round(20);
      const g = Math.round(50 + t * 130);
      const b = Math.round(30 + t * 40);
      return `rgb(${r},${g},${b})`;
    }
    case 'cameras': {
      const cov = district.cameraCoverage / 100;
      return `rgb(${Math.round(20)}, ${Math.round(30 + cov * 100)}, ${Math.round(50 + cov * 100)})`;
    }
    case 'responders': {
      const pressure = district.responderPressure / 100;
      return `rgb(${Math.round(50 + pressure * 100)}, ${Math.round(80 - pressure * 60)}, ${Math.round(20)})`;
    }
    case 'incidents':
    default: {
      const visual = getDistrictVisualStatus(game, districtId);
      return visual.color;
    }
  }
}

export default function CityMapPanel() {
  const game = useCityWatchStore((s) => s.game);
  const ui = useCityWatchStore((s) => s.ui);
  const setUI = useCityWatchStore((s) => s.setUI);
  const selectDistrict = useCityWatchStore((s) => s.selectDistrict);

  const OVERLAY_MODES: MapOverlayMode[] = ['incidents', 'panic', 'trust', 'cameras', 'responders'];

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      <div className="panel-header">
        <span>City Map</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {OVERLAY_MODES.map((mode) => (
            <button
              key={mode}
              className={`btn btn-sm ${ui.mapOverlayMode === mode ? 'btn-primary' : ''}`}
              onClick={() => setUI({ mapOverlayMode: mode })}
              style={{ padding: '2px 8px', fontSize: 10 }}
            >
              {OVERLAY_LABELS[mode]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <svg
          viewBox="0 0 640 360"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Background */}
          <rect width="640" height="360" fill="#0a0c10" />

          {/* Grid lines for atmosphere */}
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 30} x2="640" y2={i * 30} stroke="#1a2030" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 22 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 30} y1="0" x2={i * 30} y2="360" stroke="#1a2030" strokeWidth="0.5" />
          ))}

          {INITIAL_DISTRICTS.map((d) => {
            const visual = getDistrictVisualStatus(game, d.id);
            const isSelected = ui.selectedDistrictId === d.id;
            const isHovered = ui.hoveredDistrictId === d.id;
            const fillColor = getOverlayColor(ui.mapOverlayMode, d.id, game);
            const district = game.city.districtsById[d.id];
            const activeIncidents = game.incidents.activeIds.filter(
              (id) => game.incidents.incidentsById[id]?.districtId === d.id
            ).length;

            return (
              <g key={d.id}>
                <polygon
                  points={d.svgPoints}
                  fill={fillColor}
                  stroke={isSelected ? '#60a0e0' : isHovered ? '#3a5a7a' : '#243040'}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 1.5 : 1}
                  style={{ cursor: 'pointer', transition: 'fill 0.4s ease' }}
                  onClick={() => selectDistrict(d.id)}
                  onMouseEnter={() => setUI({ hoveredDistrictId: d.id })}
                  onMouseLeave={() => setUI({ hoveredDistrictId: null })}
                />

                {/* District name label */}
                <text
                  x={d.labelX}
                  y={d.labelY}
                  textAnchor="middle"
                  fill={isSelected ? '#c8d8e8' : '#7a9ab8'}
                  fontSize="11"
                  fontFamily="system-ui"
                  fontWeight={isSelected ? '600' : '400'}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {d.name}
                </text>

                {/* Panic value */}
                {district && (
                  <text
                    x={d.labelX}
                    y={d.labelY + 14}
                    textAnchor="middle"
                    fill={district.panic > 60 ? '#ff7040' : '#4a6278'}
                    fontSize="9"
                    fontFamily="monospace"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    P:{Math.round(district.panic)}% T:{Math.round(district.trust)}%
                  </text>
                )}

                {/* Incident markers */}
                {activeIncidents > 0 && (
                  <g>
                    <circle
                      cx={d.labelX + 26}
                      cy={d.labelY - 12}
                      r="8"
                      fill="#7a0020"
                      stroke="#ff4040"
                      strokeWidth="1"
                    />
                    <text
                      x={d.labelX + 26}
                      y={d.labelY - 9}
                      textAnchor="middle"
                      fill="#ffaaaa"
                      fontSize="9"
                      fontWeight="700"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {activeIncidents}
                    </text>
                  </g>
                )}

                {/* Suspicion indicator */}
                {visual.panicLevel === 'critical' && (
                  <text
                    x={d.labelX - 26}
                    y={d.labelY - 10}
                    textAnchor="middle"
                    fill="#ff4040"
                    fontSize="14"
                    style={{ pointerEvents: 'none' }}
                  >
                    ⚠
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ padding: '6px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, fontSize: 10, color: 'var(--text-muted)' }}>
        <span>Overlay: {OVERLAY_LABELS[ui.mapOverlayMode]}</span>
        <span style={{ marginLeft: 'auto' }}>Click district to inspect</span>
      </div>
    </div>
  );
}
