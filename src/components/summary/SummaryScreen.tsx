import { useCityWatchStore } from '../../store/gameStore';
import { formatElapsed } from '../../store/selectors';

export default function SummaryScreen() {
  const game = useCityWatchStore((s) => s.game);
  const keyEvents = useCityWatchStore((s) => s.keyEvents);
  const startRun = useCityWatchStore((s) => s.startRun);
  const setScreen = useCityWatchStore((s) => s.setScreen);

  const outcome = game.run.outcome;
  const sentCount = game.communications.sentActionIds.length;
  const resolvedCount = game.incidents.resolvedIds.length;
  const totalIncidents = Object.keys(game.incidents.incidentsById).length;

  const districts = game.city.districtIds.map((id) => ({
    district: game.city.districtsById[id],
    hint: game.summary.districtOutcomeHints[id],
  }));

  const handleRestart = () => {
    startRun();
    setScreen('briefing');
  };

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      background: 'var(--bg-base)',
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{ maxWidth: 680, width: '100%' }}>
        {/* Outcome header */}
        <div style={{
          textAlign: 'center',
          padding: '32px 0 24px',
          borderBottom: '1px solid var(--border)',
          marginBottom: 24,
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 40,
            fontWeight: 700,
            color: outcome === 'victory' ? 'var(--text-ok)' : 'var(--text-critical)',
            letterSpacing: 6,
            marginBottom: 8,
          }}>
            {outcome === 'victory' ? 'CONTAINED' : 'CITY LOST'}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {outcome === 'victory'
              ? 'The threat was identified and neutralized. The city endures.'
              : 'The city fell to chaos. The entity was never stopped.'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Run duration: {formatElapsed(game.run.elapsedSeconds)} · Phase reached: {game.run.phase.toUpperCase()}
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Trust', value: `${Math.round(game.city.citywideTrust)}%`, color: game.city.citywideTrust > 50 ? 'var(--text-ok)' : 'var(--text-critical)' },
            { label: 'Panic', value: `${Math.round(game.city.citywidePanic)}%`, color: game.city.citywidePanic < 50 ? 'var(--text-ok)' : 'var(--text-critical)' },
            { label: 'Actions Sent', value: sentCount, color: 'var(--text-primary)' },
            { label: 'Resolved', value: `${resolvedCount}/${totalIncidents}`, color: 'var(--text-secondary)' },
          ].map((stat) => (
            <div key={stat.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontFamily: 'var(--font-mono)', color: stat.color as string }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* District outcomes */}
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-header"><span>District Fates</span></div>
          <div style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {districts.map(({ district, hint }) => {
              const hintColor =
                hint === 'stable' ? 'var(--text-ok)' :
                hint === 'contested' ? 'var(--text-warning)' :
                hint === 'lost' ? 'var(--text-critical)' : 'var(--text-muted)';
              return (
                <div key={district.id} style={{ background: 'var(--bg-elevated)', borderRadius: 4, padding: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {district.name}
                  </div>
                  <div style={{ fontSize: 10, color: hintColor, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                    {hint ?? 'unknown'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    P:{Math.round(district.panic)}% T:{Math.round(district.trust)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key events timeline */}
        <div className="panel" style={{ marginBottom: 24 }}>
          <div className="panel-header"><span>Key Events</span></div>
          <div style={{ padding: 8, maxHeight: 240, overflowY: 'auto' }}>
            {keyEvents.length === 0 ? (
              <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 12 }}>No notable events recorded.</div>
            ) : (
              keyEvents.map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 8px', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: 48, marginTop: 2 }}>
                    {formatElapsed(e.timestamp)}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{e.description}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Restart */}
        <button
          className="btn btn-primary"
          onClick={handleRestart}
          style={{ width: '100%', padding: 14, fontSize: 14, justifyContent: 'center', textTransform: 'uppercase', letterSpacing: 4 }}
        >
          ↺ New Run
        </button>
      </div>
    </div>
  );
}
