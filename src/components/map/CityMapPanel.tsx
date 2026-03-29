import { useCityWatchStore } from '../../store/gameStore';
import { getDistrictVisualStatus } from '../../store/selectors';
import type { GameState, MapOverlayMode } from '../../types';
import { INITIAL_DISTRICTS } from '../../data/cityData';

const OVERLAY_LABELS: Record<MapOverlayMode, string> = {
  incidents: 'Civil Order',
  panic: 'Panic Dispersion',
  trust: 'Compliance',
  cameras: 'Feed Coverage',
  responders: 'Responder Load',
};

function getSectorCode(districtId: string, index: number): string {
  return `${String(index + 1).padStart(2, '0')}-${districtId.slice(0, 1).toUpperCase()}`;
}

function getOverlayColor(mode: MapOverlayMode, districtId: string, game: GameState): string {
  const district = game.city.districtsById[districtId];
  if (!district) return '#4a4031';

  switch (mode) {
    case 'panic':
      return district.panic >= 75 ? '#5f3926' : district.panic >= 45 ? '#776041' : '#6f6a55';
    case 'trust':
      return district.trust >= 70 ? '#6d7558' : district.trust >= 45 ? '#8a7b59' : '#6d5845';
    case 'cameras':
      return district.cameraCoverage >= 70 ? '#6f7d78' : district.cameraCoverage >= 40 ? '#706c5d' : '#544c41';
    case 'responders':
      return district.responderPressure >= 70 ? '#6a4837' : district.responderPressure >= 45 ? '#76674f' : '#6f6a58';
    case 'incidents':
    default:
      return getDistrictVisualStatus(game, districtId).color;
  }
}

export default function CityMapPanel() {
  const game = useCityWatchStore((s) => s.game);
  const ui = useCityWatchStore((s) => s.ui);
  const setUI = useCityWatchStore((s) => s.setUI);
  const selectDistrict = useCityWatchStore((s) => s.selectDistrict);

  const selectedDistrict = ui.selectedDistrictId ? game.city.districtsById[ui.selectedDistrictId] : null;
  const activeRoutes = selectedDistrict
    ? selectedDistrict.adjacencyIds
        .map((id) => game.city.districtsById[id])
        .filter(Boolean)
        .map((district) => ({
          x1: selectedDistrict.labelX,
          y1: selectedDistrict.labelY,
          x2: district.labelX,
          y2: district.labelY,
          label: district.name,
        }))
    : [];

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      <div className="panel-header">
        <span>City Sector Board</span>
        <div className="metadata-row" style={{ justifyContent: 'flex-end', gap: 10 }}>
          <span>Routing Layer: Active</span>
          <span>Review Focus: {selectedDistrict?.name ?? 'None'}</span>
        </div>
      </div>

      <div className="control-plate" style={{ margin: 12, marginBottom: 0 }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8 }}>
          Overlay Toggle Bank
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(['incidents', 'panic', 'trust', 'cameras', 'responders'] as MapOverlayMode[]).map((mode) => (
            <button
              key={mode}
              className={`btn btn-sm ${ui.mapOverlayMode === mode ? 'btn-primary' : ''}`}
              onClick={() => setUI({ mapOverlayMode: mode })}
            >
              {OVERLAY_LABELS[mode]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: 12, paddingTop: 10, minHeight: 0 }}>
        <div className="monitor-well" style={{ height: '100%', padding: 14 }}>
          <svg viewBox="0 0 640 360" style={{ width: '100%', height: '100%' }}>
            <defs>
              <pattern id="paper-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#685943" strokeWidth="0.8" opacity="0.4" />
              </pattern>
              <pattern id="crosshatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                <line x1="0" y1="0" x2="0" y2="12" stroke="#46392b" strokeWidth="3" opacity="0.55" />
              </pattern>
            </defs>

            <rect width="640" height="360" fill="#9f947d" />
            <rect width="640" height="360" fill="url(#paper-grid)" />
            <rect x="12" y="12" width="616" height="336" fill="none" stroke="#514435" strokeWidth="2" />

            {activeRoutes.map((route, index) => (
              <g key={`${route.label}-${index}`}>
                <line
                  x1={route.x1}
                  y1={route.y1}
                  x2={route.x2}
                  y2={route.y2}
                  stroke="#4f4b36"
                  strokeDasharray="9 7"
                  strokeWidth="2"
                />
                <polygon
                  points={`${route.x2},${route.y2} ${route.x2 - 10},${route.y2 - 3} ${route.x2 - 3},${route.y2 - 10}`}
                  fill="#4f4b36"
                />
              </g>
            ))}

            {INITIAL_DISTRICTS.map((districtDef, index) => {
              const visual = getDistrictVisualStatus(game, districtDef.id);
              const isSelected = ui.selectedDistrictId === districtDef.id;
              const isHovered = ui.hoveredDistrictId === districtDef.id;
              const fillColor = getOverlayColor(ui.mapOverlayMode, districtDef.id, game);
              const district = game.city.districtsById[districtDef.id];
              const activeIncidents = game.incidents.activeIds.filter(
                (id) => game.incidents.incidentsById[id]?.districtId === districtDef.id
              ).length;
              const sectorCode = getSectorCode(districtDef.id, index);
              const isDegraded = district && district.infrastructureStability < 60;

              return (
                <g key={districtDef.id}>
                  <polygon
                    points={districtDef.svgPoints}
                    fill={fillColor}
                    stroke={isSelected ? '#b94d2a' : isHovered ? '#685943' : '#514435'}
                    strokeWidth={isSelected ? 4 : isHovered ? 2.4 : 1.8}
                    style={{ cursor: 'pointer' }}
                    onClick={() => selectDistrict(districtDef.id)}
                    onMouseEnter={() => setUI({ hoveredDistrictId: districtDef.id })}
                    onMouseLeave={() => setUI({ hoveredDistrictId: null })}
                  />

                  {isDegraded && <polygon points={districtDef.svgPoints} fill="url(#crosshatch)" opacity="0.7" />}

                  {visual.panicLevel === 'critical' && (
                    <g transform={`translate(${districtDef.labelX + 48},${districtDef.labelY - 28})`}>
                      <circle r="14" fill="#6d2f22" stroke="#d8c5ae" strokeWidth="1.5" />
                      <text x="0" y="4" textAnchor="middle" fontSize="16" fill="#f4e9d5">!</text>
                    </g>
                  )}

                  {activeIncidents > 0 && (
                    <g transform={`translate(${districtDef.labelX - 58},${districtDef.labelY - 24})`}>
                      <rect width="44" height="18" fill="#8e4d34" stroke="#3b1f15" strokeWidth="1.5" />
                      <text x="22" y="12.5" textAnchor="middle" fill="#f8ecdd" fontSize="9" letterSpacing="1.4">
                        {activeIncidents} MARK
                      </text>
                    </g>
                  )}

                  <text
                    x={districtDef.labelX}
                    y={districtDef.labelY - 2}
                    textAnchor="middle"
                    fill="#201910"
                    fontSize="13"
                    fontFamily="Arial Narrow"
                    fontWeight="700"
                    letterSpacing="1.2"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {districtDef.name.toUpperCase()}
                  </text>

                  <text
                    x={districtDef.labelX}
                    y={districtDef.labelY + 14}
                    textAnchor="middle"
                    fill="#4a4031"
                    fontSize="9"
                    fontFamily="Courier New"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {sectorCode} · P {Math.round(district?.panic ?? 0)} · T {Math.round(district?.trust ?? 0)}
                  </text>

                  {isSelected && (
                    <rect
                      x={districtDef.labelX - 72}
                      y={districtDef.labelY - 34}
                      width="144"
                      height="54"
                      fill="none"
                      stroke="#2b2218"
                      strokeWidth="1.5"
                      strokeDasharray="8 6"
                    />
                  )}
                </g>
              );
            })}

            <g transform="translate(36,34)">
              <rect width="168" height="72" fill="rgba(68,56,39,0.9)" stroke="#352b1f" strokeWidth="2" />
              <text x="12" y="18" fill="#e9dcc5" fontSize="11" letterSpacing="1.8">PLANNING BOARD</text>
              <text x="12" y="36" fill="#cbbf9e" fontSize="10">Manual routes and incident stamps</text>
              <text x="12" y="54" fill="#cbbf9e" fontSize="10">Sector review under glass</text>
            </g>
          </svg>
        </div>
      </div>

      <div style={{ padding: '0 12px 12px', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
        <div className="control-plate">
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4 }}>Selected Sector</div>
          <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>{selectedDistrict?.name ?? 'Awaiting selection'}</div>
        </div>
        <div className="control-plate">
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4 }}>Overlay</div>
          <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>{OVERLAY_LABELS[ui.mapOverlayMode]}</div>
        </div>
        <div className="control-plate">
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4 }}>Stamped Alerts</div>
          <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>{game.incidents.activeIds.length} active markers</div>
        </div>
        <div className="control-plate">
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4 }}>Routing Note</div>
          <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>Click any district to open formal review.</div>
        </div>
      </div>
    </div>
  );
}
