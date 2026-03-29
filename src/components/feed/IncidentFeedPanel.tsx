import { useCityWatchStore } from '../../store/gameStore';
import { getSortedIncidentFeed } from '../../store/selectors';
import type { Incident, IncidentFeedFilter } from '../../types';
import { INCIDENT_TYPE_LABELS } from '../../data/cityData';

const SEVERITY_STAMPS = ['', 'Routine', 'Watch', 'Flagged', 'Critical', 'Fatal'];
const STATUS_BADGE: Record<string, string> = {
  active: 'badge-warning',
  resolved: 'badge-ok',
  expired: 'badge-muted',
  escalated: 'badge-critical',
};

function getRecommendation(incident: Incident): string {
  if (incident.severity >= 5) return 'Escalate to central review';
  if (incident.type === 'camera_outage' || incident.type === 'signal_spoofing') return 'Route CCTV verification';
  if (incident.type === 'public_panic_flare') return 'Issue district bulletin';
  return 'Monitor and process';
}

function SectorDossierCard({ incident, selected, onClick }: { incident: Incident; selected: boolean; onClick: () => void }) {
  const district = useCityWatchStore((s) => s.game.city.districtsById[incident.districtId]);
  const riskColor =
    incident.severity >= 5 ? 'var(--text-critical)' : incident.severity >= 4 ? 'var(--text-warning)' : '#5d513c';

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      <div
        className="paper-card"
        style={{
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          borderLeft: `8px solid ${selected ? 'var(--text-critical)' : '#7a6e56'}`,
          outline: selected ? '2px solid var(--text-critical)' : '1px solid rgba(0,0,0,0.18)',
          outlineOffset: -1,
          minHeight: 172,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#574a35' }}>
              Case {incident.id.slice(-6).toUpperCase()}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.04em', marginTop: 2 }}>
              {district?.name ?? incident.districtId} Dossier
            </div>
          </div>
          <span className="stamp" style={{ color: riskColor }}>
            {SEVERITY_STAMPS[incident.severity]}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
          <div>
            <div style={{ color: '#655944', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 9 }}>Current State</div>
            <div>{INCIDENT_TYPE_LABELS[incident.type] ?? incident.type}</div>
          </div>
          <div>
            <div style={{ color: '#655944', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 9 }}>Risk Level</div>
            <div>{incident.severity}/5</div>
          </div>
          <div>
            <div style={{ color: '#655944', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 9 }}>Responder Density</div>
            <div>{Math.round(district?.policePresence ?? 0)}%</div>
          </div>
          <div>
            <div style={{ color: '#655944', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 9 }}>Infrastructure</div>
            <div>{Math.round(district?.infrastructureStability ?? 0)}%</div>
          </div>
          <div>
            <div style={{ color: '#655944', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 9 }}>Witness Density</div>
            <div>{Math.round((district?.populationDensity ?? 0) * 0.8)}%</div>
          </div>
          <div>
            <div style={{ color: '#655944', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 9 }}>Status</div>
            <span className={`badge ${STATUS_BADGE[incident.status] ?? 'badge-muted'}`}>{incident.status}</span>
          </div>
        </div>

        <div style={{ borderTop: '1px dashed rgba(42,36,25,0.35)', paddingTop: 8, fontSize: 11, lineHeight: 1.45 }}>
          <div style={{ color: '#655944', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 9, marginBottom: 2 }}>
            Recommended Action
          </div>
          <div style={{ fontWeight: 700 }}>{getRecommendation(incident)}</div>
          <div style={{ marginTop: 4, color: '#4f4432' }}>{incident.description}</div>
        </div>
      </div>
    </button>
  );
}

const FILTER_TABS: { key: IncidentFeedFilter; label: string }[] = [
  { key: 'all', label: 'Queue' },
  { key: 'critical', label: 'Fatal' },
  { key: 'active', label: 'Open' },
  { key: 'resolved', label: 'Archived' },
];

export default function IncidentFeedPanel() {
  const game = useCityWatchStore((s) => s.game);
  const ui = useCityWatchStore((s) => s.ui);
  const setUI = useCityWatchStore((s) => s.setUI);
  const selectIncident = useCityWatchStore((s) => s.selectIncident);

  const incidents = getSortedIncidentFeed(game, ui.incidentFeedFilter);

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      <div className="panel-header">
        <span>Sector Dossiers</span>
        <span style={{ color: 'var(--text-muted)' }}>{game.incidents.activeIds.length} pending review</span>
      </div>

      <div style={{ padding: '10px 12px', borderBottom: '2px solid var(--border)' }}>
        <div className="metadata-row" style={{ marginBottom: 8 }}>
          <span>Sort: Time</span>
          <span>Queue: Incident</span>
          <span>Supervisor Initial: RB</span>
        </div>
        <div className="tabs">
          {FILTER_TABS.map((t) => (
            <button
              key={t.key}
              className={`tab ${ui.incidentFeedFilter === t.key ? 'active' : ''}`}
              onClick={() => setUI({ incidentFeedFilter: t.key })}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '10px 12px', borderBottom: '2px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 62px 58px', gap: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          <span>Time</span>
          <span>Sector / Type</span>
          <span>Status</span>
          <span style={{ textAlign: 'right' }}>Risk</span>
        </div>
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {incidents.slice(0, 4).map((inc) => (
            <button
              key={`${inc.id}-strip`}
              type="button"
              onClick={() => selectIncident(inc.id)}
              style={{
                border: 'none',
                background: ui.selectedIncidentId === inc.id ? 'rgba(185,77,42,0.18)' : 'rgba(255,255,255,0.02)',
                color: 'var(--text-primary)',
                textAlign: 'left',
                padding: '6px 8px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 62px 58px', gap: 8 }}>
                <span>{String(Math.floor(inc.timestamp / 60)).padStart(2, '0')}:{String(Math.floor(inc.timestamp % 60)).padStart(2, '0')}</span>
                <span>{(game.city.districtsById[inc.districtId]?.name ?? inc.districtId).toUpperCase()} / {(INCIDENT_TYPE_LABELS[inc.type] ?? inc.type).toUpperCase()}</span>
                <span>{inc.status.toUpperCase()}</span>
                <span style={{ textAlign: 'right' }}>R-{inc.severity}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {incidents.length === 0 ? (
          <div className="control-plate" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            No dossiers in the selected queue.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {incidents.map((inc) => (
              <SectorDossierCard
                key={inc.id}
                incident={inc}
                selected={ui.selectedIncidentId === inc.id}
                onClick={() => selectIncident(inc.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '10px 12px', borderTop: '2px solid var(--border)', display: 'flex', gap: 12, fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        <span>Archived: {game.incidents.resolvedIds.length}</span>
        <span style={{ marginLeft: 'auto' }}>Total cases: {Object.keys(game.incidents.incidentsById).length}</span>
      </div>
    </div>
  );
}
