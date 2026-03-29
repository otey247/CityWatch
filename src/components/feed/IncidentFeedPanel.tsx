import { useCityWatchStore } from '../../store/gameStore';
import { getSortedIncidentFeed } from '../../store/selectors';
import type { Incident, IncidentFeedFilter } from '../../types';
import { INCIDENT_TYPE_LABELS } from '../../data/cityData';

const SEVERITY_COLORS = ['', '#40c880', '#8abf40', '#ffb040', '#ff7020', '#ff4040'];
const STATUS_BADGE: Record<string, string> = {
  active: 'badge-warning',
  resolved: 'badge-ok',
  expired: 'badge-muted',
  escalated: 'badge-critical',
};

function IncidentFeedItem({ incident, selected, onClick }: { incident: Incident; selected: boolean; onClick: () => void }) {
  const district = useCityWatchStore((s) => s.game.city.districtsById[incident.districtId]);
  const color = SEVERITY_COLORS[incident.severity] ?? '#7a9ab8';

  return (
    <div
      onClick={onClick}
      style={{
        padding: '8px 10px',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        background: selected ? 'var(--bg-panel)' : 'transparent',
        borderLeft: `3px solid ${color}`,
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'; }}
      onMouseLeave={(e) => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
          {INCIDENT_TYPE_LABELS[incident.type] ?? incident.type}
        </span>
        <span className={`badge ${STATUS_BADGE[incident.status] ?? 'badge-muted'}`}>
          {incident.status}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{district?.name ?? incident.districtId}</span>
        <span style={{ fontSize: 10, color, marginLeft: 'auto' }}>
          {'█'.repeat(incident.severity)}{'░'.repeat(5 - incident.severity)}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          {Math.round(incident.confidence)}% conf
        </span>
      </div>
    </div>
  );
}

const FILTER_TABS: { key: IncidentFeedFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'active', label: 'Active' },
  { key: 'resolved', label: 'Resolved' },
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
        <span>Incident Feed</span>
        <span style={{ color: 'var(--text-muted)' }}>{game.incidents.activeIds.length} open</span>
      </div>

      {/* Filter tabs */}
      <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>
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

      {/* Feed list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {incidents.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No incidents in this view
          </div>
        ) : (
          incidents.map((inc) => (
            <IncidentFeedItem
              key={inc.id}
              incident={inc}
              selected={ui.selectedIncidentId === inc.id}
              onClick={() => selectIncident(inc.id)}
            />
          ))
        )}
      </div>

      {/* Footer stats */}
      <div style={{ padding: '6px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
        <span>Resolved: {game.incidents.resolvedIds.length}</span>
        <span style={{ marginLeft: 'auto' }}>Total: {Object.keys(game.incidents.incidentsById).length}</span>
      </div>
    </div>
  );
}
