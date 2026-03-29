import { useCityWatchStore } from '../../store/gameStore';
import { getCitywideStatus, formatElapsed } from '../../store/selectors';

const PHASE_LABELS = {
  early: 'EARLY',
  mid: 'MID',
  late: 'LATE — CRITICAL',
  ended: 'ENDED',
};

const PHASE_COLORS = {
  early: '#40c880',
  mid: '#ffb040',
  late: '#ff4040',
  ended: '#7a9ab8',
};

const ENTITY_PHASE_LABELS = {
  hidden: 'Threat: Undetected',
  recognized: 'Threat: Recognized',
  crisis: 'Threat: ACTIVE',
};

export default function TopStatusBar() {
  const game = useCityWatchStore((s) => s.game);
  const status = getCitywideStatus(game);

  const trustColor =
    status.trust >= 60 ? 'var(--text-ok)' : status.trust >= 35 ? 'var(--text-warning)' : 'var(--text-critical)';
  const panicColor =
    status.panic <= 30 ? 'var(--text-ok)' : status.panic <= 60 ? 'var(--text-warning)' : 'var(--text-critical)';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '6px 16px',
      background: 'var(--bg-elevated)',
      borderBottom: '1px solid var(--border)',
      height: 44,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: '#a0c0e0', letterSpacing: 4, marginRight: 8 }}>
        CITYWATCH
      </div>

      {/* Run clock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--text-primary)', minWidth: 60 }}>
        {formatElapsed(game.run.elapsedSeconds)}
      </div>

      {/* Phase */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2 }}>Phase</span>
        <span className="badge" style={{ background: 'transparent', border: `1px solid ${PHASE_COLORS[status.phase]}`, color: PHASE_COLORS[status.phase], fontSize: 10 }}>
          {PHASE_LABELS[status.phase]}
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Entity phase */}
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: status.entityPhase === 'crisis' ? 'var(--text-critical)' : status.entityPhase === 'recognized' ? 'var(--text-warning)' : 'var(--text-muted)' }}>
        ⚠ {ENTITY_PHASE_LABELS[status.entityPhase]}
      </div>

      <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

      {/* Trust */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 80 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
          <span>TRUST</span>
          <span style={{ color: trustColor }}>{Math.round(status.trust)}%</span>
        </div>
        <div className="meter meter-trust">
          <div className="meter-bar" style={{ width: `${status.trust}%` }} />
        </div>
      </div>

      {/* Panic */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 80 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
          <span>PANIC</span>
          <span style={{ color: panicColor }}>{Math.round(status.panic)}%</span>
        </div>
        <div className="meter meter-panic">
          <div className="meter-bar" style={{ width: `${status.panic}%` }} />
        </div>
      </div>

      <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

      {/* Incident counts */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontFamily: 'var(--font-mono)', color: status.openIncidents > 5 ? 'var(--text-warning)' : 'var(--text-primary)' }}>
            {status.openIncidents}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Open</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontFamily: 'var(--font-mono)', color: status.criticalIncidents > 0 ? 'var(--text-critical)' : 'var(--text-muted)' }}>
            {status.criticalIncidents}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Critical</div>
        </div>
      </div>
    </div>
  );
}
