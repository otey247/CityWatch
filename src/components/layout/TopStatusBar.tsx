import { useCityWatchStore } from '../../store/gameStore';
import { getCitywideStatus, formatElapsed } from '../../store/selectors';

const PHASE_LABELS = {
  early: 'Routine Observation',
  mid: 'Priority Review',
  late: 'Threshold Exceeded',
  ended: 'Terminal Archive',
};

const PHASE_COLORS = {
  early: 'var(--text-ok)',
  mid: 'var(--text-warning)',
  late: 'var(--text-critical)',
  ended: 'var(--text-secondary)',
};

const ENTITY_PHASE_LABELS = {
  hidden: 'Source Unconfirmed',
  recognized: 'Source Recognized',
  crisis: 'Manifestation Active',
};

function CounterBlock({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="counter-window">
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: accent ?? 'var(--text-primary)', letterSpacing: '0.08em' }}>
        {value}
      </div>
      <div style={{ marginTop: 4, fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  );
}

export default function TopStatusBar() {
  const game = useCityWatchStore((s) => s.game);
  const status = getCitywideStatus(game);

  const activeSectorCount = game.city.districtIds.filter((id) => {
    const district = game.city.districtsById[id];
    return district && (district.panic >= 35 || district.trust <= 55 || district.incidentCount > 0);
  }).length;

  const lampState = status.criticalIncidents > 0 ? 'lamp-red' : status.openIncidents > 2 ? 'lamp-amber' : 'lamp-green';

  return (
    <div className="panel" style={{ flexShrink: 0 }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
        gap: 12,
        padding: 12,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              padding: '10px 14px',
              border: '2px solid var(--border-bright)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.18)), var(--bg-elevated)',
              minWidth: 0,
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                Municipal Surveillance Bureau
              </div>
              <div style={{ fontSize: 18, color: 'var(--text-primary)', letterSpacing: '0.24em', textTransform: 'uppercase', marginTop: 4 }}>
                Human Incident Processing Terminal
              </div>
              <div className="metadata-row" style={{ marginTop: 6 }}>
                <span>Model 7B-1953</span>
                <span>Operator N-1421</span>
                <span>Clearance: Municipal Black</span>
              </div>
            </div>

            <div className="control-plate" style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 230 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 }}>
                  System Lamps
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: '6px 10px', alignItems: 'center', fontSize: 10, color: 'var(--text-secondary)' }}>
                  <span className={`lamp ${lampState}`} />
                  <span>Terminal</span>
                  <span className={`lamp ${status.entityPhase === 'crisis' ? 'lamp-red' : 'lamp-green'}`} />
                  <span>Feed Router</span>
                  <span className={`lamp ${status.openIncidents > 0 ? 'lamp-amber' : 'lamp-green'}`} />
                  <span>Archive</span>
                </div>
              </div>
            </div>
          </div>

          <div className="metadata-row">
            <span>Shift: Night</span>
            <span>Terminal Time: {formatElapsed(game.run.elapsedSeconds)}</span>
            <span>Sort Mode: Time</span>
            <span>Protocol Status: {PHASE_LABELS[status.phase]}</span>
            <span>Feed Status: {status.entityPhase === 'crisis' ? 'Compromised' : 'Live'}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
          <CounterBlock label="Compliance" value={`${Math.round(status.trust)}%`} accent="var(--text-primary)" />
          <CounterBlock label="Panic" value={`${Math.round(status.panic)}%`} accent="var(--text-warning)" />
          <CounterBlock label="Exposure Risk" value={`${Math.round(game.entity.exposureRisk)}%`} accent="var(--text-critical)" />
          <CounterBlock label="Active Sectors" value={activeSectorCount} accent="var(--text-secondary)" />
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto auto auto',
        gap: 12,
        alignItems: 'center',
        padding: '0 12px 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Entity Review</span>
          <span className="badge" style={{ color: PHASE_COLORS[status.phase], borderColor: PHASE_COLORS[status.phase] }}>
            {PHASE_LABELS[status.phase]}
          </span>
          <span style={{ fontSize: 11, color: status.entityPhase === 'crisis' ? 'var(--text-critical)' : status.entityPhase === 'recognized' ? 'var(--text-warning)' : 'var(--text-secondary)' }}>
            {ENTITY_PHASE_LABELS[status.entityPhase]}
          </span>
        </div>

        <div style={{ minWidth: 180 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
            <span>Citywide Compliance</span>
            <span style={{ color: 'var(--text-primary)' }}>{Math.round(status.trust)}%</span>
          </div>
          <div className="meter meter-trust">
            <div className="meter-bar" style={{ width: `${status.trust}%` }} />
          </div>
        </div>

        <div style={{ minWidth: 180 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
            <span>Citywide Panic</span>
            <span style={{ color: 'var(--text-warning)' }}>{Math.round(status.panic)}%</span>
          </div>
          <div className="meter meter-panic">
            <div className="meter-bar" style={{ width: `${status.panic}%` }} />
          </div>
        </div>

        <div className="control-plate" style={{ minWidth: 156 }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 6 }}>
            Review Counts
          </div>
          <div className="metadata-row" style={{ gap: 10 }}>
            <span>Open: {status.openIncidents}</span>
            <span>Critical: {status.criticalIncidents}</span>
            <span>Integrity: {Math.round(status.integrity)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
