import { useCityWatchStore } from '../../store/gameStore';

const DISTRICTS = ['Downtown', 'Midtown', 'Riverside', 'Old Port', 'Eastside', 'Suburbs'];

export default function BriefingScreen() {
  const startRun = useCityWatchStore((s) => s.startRun);
  const setScreen = useCityWatchStore((s) => s.setScreen);

  const handleStart = () => {
    startRun();
    setScreen('operations');
  };

  return (
    <div style={{
      height: '100%',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ maxWidth: 640, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 6, marginBottom: 4, textTransform: 'uppercase' }}>
            CITYWATCH
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: 4, textTransform: 'uppercase' }}>
            Municipal Surveillance Bureau · Shift Briefing
          </div>
        </div>

        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-header">
            <span>Bureau Header Plate</span>
            <span style={{ color: 'var(--text-critical)', fontSize: 10 }}>Clearance Black</span>
          </div>
          <div style={{ padding: 16, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <p style={{ marginBottom: 12 }}>
              You are <strong style={{ color: 'var(--text-primary)' }}>Observer</strong>. Your clearance level grants access
              to city surveillance feeds, emergency dispatch, and limited infrastructure systems.
            </p>
            <p style={{ marginBottom: 12 }}>
              Intelligence suggests an unclassified entity has entered the metropolitan area.
              Designation: <strong style={{ color: 'var(--text-critical)' }}>UNKNOWN</strong>.
              Behavioral pattern: slasher-mimic hybrid. It exploits camera blind spots and manipulates
              emergency signals.
            </p>
            <p style={{ marginBottom: 12 }}>
              You cannot deploy forces directly. You cannot arrest. You cannot save anyone with your own hands.
              You can <strong style={{ color: 'var(--text-primary)' }}>observe</strong>,{' '}
              <strong style={{ color: 'var(--text-primary)' }}>communicate</strong>, and{' '}
              <strong style={{ color: 'var(--text-primary)' }}>influence</strong>.
            </p>
            <p>
              If citywide panic reaches critical mass, or public trust collapses — the city falls.
            </p>
          </div>
        </div>

        <div className="panel" style={{ marginBottom: 24 }}>
          <div className="panel-header">
            <span>Sector Planning Board</span>
            <span style={{ color: 'var(--text-muted)' }}>{DISTRICTS.length} districts</span>
          </div>
          <div style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {DISTRICTS.map((name) => (
              <div key={name} style={{ background: 'var(--bg-elevated)', borderRadius: 4, padding: '8px 10px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Status: Nominal</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Victory', text: 'Expose and neutralize the threat before the city collapses.', color: 'var(--text-ok)' },
            { label: 'Failure', text: 'Panic exceeds 95%, trust collapses, or 4+ districts fall.', color: 'var(--text-critical)' },
          ].map((item) => (
            <div key={item.label} style={{ background: 'var(--bg-surface)', border: `1px solid var(--border)`, borderRadius: 6, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: item.color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.text}</div>
            </div>
          ))}
        </div>

        <button
          className="btn btn-primary"
          onClick={handleStart}
          style={{ width: '100%', padding: 16, fontSize: 15, justifyContent: 'center', textTransform: 'uppercase', letterSpacing: 4 }}
        >
          Begin Terminal Shift
        </button>
      </div>
    </div>
  );
}
