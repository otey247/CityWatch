import { useCityWatchStore } from '../../store/gameStore';
import { getSelectedDistrict, getSelectedIncident, getSuggestedActions } from '../../store/selectors';
import type { ContextTab, District, Incident } from '../../types';
import { INCIDENT_TYPE_LABELS, COMM_TYPE_LABELS } from '../../data/cityData';

const CONTEXT_TABS: { key: ContextTab; label: string }[] = [
  { key: 'district', label: 'District' },
  { key: 'incident', label: 'Incident' },
  { key: 'actions', label: 'Actions' },
  { key: 'effects', label: 'Effects' },
];

function StatRow({ label, value, max = 100, color }: { label: string; value: number; max?: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const barColor = color ?? '#4080c0';
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ color: 'var(--text-secondary)' }}>{Math.round(value)}</span>
      </div>
      <div className="meter">
        <div className="meter-bar" style={{ width: `${pct}%`, background: barColor }} />
      </div>
    </div>
  );
}

function DistrictView({ district }: { district: District }) {
  const suspicion = useCityWatchStore((s) => s.game.intelligence.districtSuspicionById[district.id] ?? 0);
  const incidentsById = useCityWatchStore((s) => s.game.incidents.incidentsById);
  const activeIncidents = useCityWatchStore((s) =>
    s.game.incidents.activeIds.filter((id) => s.game.incidents.incidentsById[id]?.districtId === district.id)
  );

  return (
    <div style={{ padding: 12, overflowY: 'auto' }}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>{district.name}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
        Pop. Density: {district.populationDensity} · Adjacent: {district.adjacencyIds.join(', ')}
      </div>

      <StatRow label="Trust" value={district.trust} color="linear-gradient(to right,#1a6a3a,#40c880)" />
      <StatRow label="Panic" value={district.panic} color="linear-gradient(to right,#804000,#ff4040)" />
      <StatRow label="Infrastructure" value={district.infrastructureStability} color="#4080c0" />
      <StatRow label="Police Presence" value={district.policePresence} color="#6060a0" />
      <StatRow label="Medical Load" value={district.medicalLoad} color="#a06020" />
      <StatRow label="Camera Coverage" value={district.cameraCoverage} color="#2070a0" />
      <StatRow label="Threat Suspicion" value={suspicion} color="#a03040" />

      <div style={{ marginTop: 12, fontSize: 12 }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', fontSize: 10, letterSpacing: 1 }}>Active Incidents</div>
        {activeIncidents.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>None</div>
        ) : (
          activeIncidents.map((id) => {
            const inc = incidentsById[id];
            return inc ? (
              <div key={id} style={{ fontSize: 11, color: 'var(--text-warning)', marginBottom: 2 }}>
                • {INCIDENT_TYPE_LABELS[inc.type]} (Sev {inc.severity})
              </div>
            ) : null;
          })
        )}
      </div>
    </div>
  );
}

function IncidentView({ incident }: { incident: Incident }) {
  const district = useCityWatchStore((s) => s.game.city.districtsById[incident.districtId]);
  const resolveIncident = useCityWatchStore((s) => s.resolveIncident);

  const confColor = incident.confidence >= 70 ? 'var(--text-ok)' : incident.confidence >= 40 ? 'var(--text-warning)' : 'var(--text-critical)';
  const sevColor = ['', '#40c880', '#8abf40', '#ffb040', '#ff7020', '#ff4040'][incident.severity] ?? '#7a9ab8';

  return (
    <div style={{ padding: 12, overflowY: 'auto' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
        {INCIDENT_TYPE_LABELS[incident.type]}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
        {district?.name ?? incident.districtId} · {new Date(incident.timestamp * 1000).toISOString().slice(11, 19)} elapsed
      </div>

      <div style={{ background: 'var(--bg-elevated)', borderRadius: 4, padding: 10, marginBottom: 12, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {incident.description}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div style={{ textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 4, padding: 8 }}>
          <div style={{ fontSize: 20, fontFamily: 'var(--font-mono)', color: sevColor }}>{incident.severity}</div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Severity</div>
        </div>
        <div style={{ textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 4, padding: 8 }}>
          <div style={{ fontSize: 20, fontFamily: 'var(--font-mono)', color: confColor }}>{Math.round(incident.confidence)}%</div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Confidence</div>
        </div>
      </div>

      <div style={{ fontSize: 11, marginBottom: 4 }}>
        <span style={{ color: 'var(--text-muted)' }}>Suspected cause: </span>
        <span style={{ color: 'var(--text-secondary)' }}>{incident.suspectedCause}</span>
      </div>
      {incident.casualtiesEstimate > 0 && (
        <div style={{ fontSize: 11, marginBottom: 4 }}>
          <span style={{ color: 'var(--text-muted)' }}>Est. casualties: </span>
          <span style={{ color: 'var(--text-critical)' }}>{incident.casualtiesEstimate}</span>
        </div>
      )}
      <div style={{ fontSize: 11, marginBottom: 12 }}>
        <span style={{ color: 'var(--text-muted)' }}>Responder assigned: </span>
        <span style={{ color: incident.responderAssigned ? 'var(--text-ok)' : 'var(--text-warning)' }}>
          {incident.responderAssigned ? 'Yes' : 'No'}
        </span>
      </div>

      {incident.status === 'active' && (
        <button className="btn btn-sm btn-primary" onClick={() => resolveIncident(incident.id)}>
          Mark Resolved
        </button>
      )}
    </div>
  );
}

function ActionsView() {
  const game = useCityWatchStore((s) => s.game);
  const ui = useCityWatchStore((s) => s.ui);
  const setUI = useCityWatchStore((s) => s.setUI);
  const setDraft = useCityWatchStore((s) => s.setDraft);
  const suggestions = getSuggestedActions(game, ui);

  return (
    <div style={{ padding: 12, overflowY: 'auto' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Suggested Actions</div>
      {suggestions.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Select a district or incident to see suggestions.</div>
      ) : (
        suggestions.map((s, i) => (
          <div key={i} style={{ background: 'var(--bg-elevated)', borderRadius: 4, padding: 10, marginBottom: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              {COMM_TYPE_LABELS[s.actionType]}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.4 }}>
              {s.rationale}
            </div>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => {
                setDraft({ actionType: s.actionType, targetDistrictId: s.targetDistrictId, urgency: s.urgency });
                setUI({ isCommunicationsDrawerOpen: true });
              }}
            >
              Use This Action
            </button>
          </div>
        ))
      )}
    </div>
  );
}

function EffectsView() {
  const game = useCityWatchStore((s) => s.game);
  const sentCount = game.communications.sentActionIds.length;
  const recent = game.communications.sentActionIds.slice(-5).reverse();

  return (
    <div style={{ padding: 12, overflowY: 'auto' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        Active Effects · {sentCount} actions sent
      </div>
      {recent.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No communications sent yet.</div>
      ) : (
        recent.map((id) => {
          const action = game.communications.actionsById[id];
          if (!action) return null;
          return (
            <div key={id} style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, padding: '6px 8px', background: 'var(--bg-elevated)', borderRadius: 4 }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{COMM_TYPE_LABELS[action.actionType]}</span>
              {' → '}{action.targetDistrictId ?? 'All'}
              <span style={{ color: action.projectedTrustImpact >= 0 ? 'var(--text-ok)' : 'var(--text-critical)', marginLeft: 8 }}>
                T{action.projectedTrustImpact >= 0 ? '+' : ''}{action.projectedTrustImpact}
              </span>
              <span style={{ color: action.projectedPanicImpact > 0 ? 'var(--text-warning)' : 'var(--text-ok)', marginLeft: 6 }}>
                P{action.projectedPanicImpact >= 0 ? '+' : ''}{action.projectedPanicImpact}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}

export default function ContextPanel() {
  const game = useCityWatchStore((s) => s.game);
  const ui = useCityWatchStore((s) => s.ui);
  const setUI = useCityWatchStore((s) => s.setUI);

  const selectedDistrict = getSelectedDistrict(game, ui);
  const selectedIncident = getSelectedIncident(game, ui);

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      <div className="panel-header">
        <span>Context</span>
        {selectedDistrict && <span style={{ color: 'var(--text-secondary)' }}>{selectedDistrict.name}</span>}
      </div>

      <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>
        <div className="tabs">
          {CONTEXT_TABS.map((t) => (
            <button
              key={t.key}
              className={`tab ${ui.activeContextTab === t.key ? 'active' : ''}`}
              onClick={() => setUI({ activeContextTab: t.key })}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {ui.activeContextTab === 'district' && selectedDistrict && (
          <DistrictView district={selectedDistrict} />
        )}
        {ui.activeContextTab === 'district' && !selectedDistrict && (
          <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 12 }}>
            Select a district on the map to inspect it.
          </div>
        )}
        {ui.activeContextTab === 'incident' && selectedIncident && (
          <IncidentView incident={selectedIncident} />
        )}
        {ui.activeContextTab === 'incident' && !selectedIncident && (
          <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 12 }}>
            Select an incident from the feed to investigate.
          </div>
        )}
        {ui.activeContextTab === 'actions' && <ActionsView />}
        {ui.activeContextTab === 'effects' && <EffectsView />}
      </div>
    </div>
  );
}
