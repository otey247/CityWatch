import { useCityWatchStore } from '../../store/gameStore';
import { getCommunicationImpactPreview } from '../../store/selectors';
import type { CommunicationActionType } from '../../types';
import { COMM_TYPE_LABELS } from '../../data/cityData';

const COMM_TYPES: CommunicationActionType[] = [
  'district_alert',
  'targeted_text',
  'responder_tip',
  'transit_notice',
  'building_alarm',
  'public_bulletin',
];

const COMM_DESCRIPTIONS: Record<CommunicationActionType, string> = {
  district_alert: 'Issue an official alert to district emergency channels.',
  targeted_text: 'Send a personal safety message to residents in the area.',
  responder_tip: 'Direct police or medical teams to a suspected incident location.',
  transit_notice: 'Push a notice to public transit systems in the district.',
  building_alarm: 'Remotely trigger a building evacuation alarm.',
  public_bulletin: 'Broadcast a city-wide public safety bulletin.',
};

export default function CommunicationsDrawer() {
  const game = useCityWatchStore((s) => s.game);
  const ui = useCityWatchStore((s) => s.ui);
  const draft = useCityWatchStore((s) => s.draft);
  const setUI = useCityWatchStore((s) => s.setUI);
  const setDraft = useCityWatchStore((s) => s.setDraft);
  const sendCommunication = useCityWatchStore((s) => s.sendCommunication);
  const resetDraft = useCityWatchStore((s) => s.resetDraft);

  const preview = getCommunicationImpactPreview(game, draft);

  if (!ui.isCommunicationsDrawerOpen) return null;

  const handleClose = () => {
    setUI({ isCommunicationsDrawerOpen: false });
    resetDraft();
  };

  const trustColor = (v: number) => v >= 0 ? 'var(--text-ok)' : 'var(--text-critical)';
  const panicColor = (v: number) => v > 0 ? 'var(--text-warning)' : 'var(--text-ok)';

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(10, 8, 5, 0.76)',
      zIndex: 50,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
    }}
    onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div style={{
        width: '100%',
        maxWidth: 760,
        background: 'var(--bg-surface)',
        border: '2px solid var(--border-bright)',
        borderRadius: 0,
        padding: 0,
        maxHeight: '78vh',
        overflowY: 'auto',
      }}>
        <div className="panel-header" style={{ padding: '12px 16px' }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
            Authorization Routing Console
          </span>
          <button className="btn btn-sm btn-danger" onClick={handleClose}>Cancel Review</button>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="metadata-row">
            <span>Protocol Status: Pending Signature</span>
            <span>Operator: N-1421</span>
            <span>Channel Scope: Administrative</span>
          </div>

          <div className="paper-card" style={{ padding: 14 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>
              Action Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {COMM_TYPES.map((type) => (
                <button
                  key={type}
                  className={`btn ${draft.actionType === type ? 'btn-primary' : ''}`}
                  style={{ flexDirection: 'column', gap: 4, padding: '8px', fontSize: 12 }}
                  onClick={() => setDraft({ actionType: type })}
                >
                  <span style={{ fontWeight: 600 }}>{COMM_TYPE_LABELS[type]}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>{COMM_DESCRIPTIONS[type]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="control-plate">
            <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>
              Target District
            </label>
            <select
              value={draft.targetDistrictId ?? ''}
              onChange={(e) => setDraft({ targetDistrictId: e.target.value || null })}
            >
              <option value="">All Districts (Citywide)</option>
              {game.city.districtIds.map((id) => {
                const d = game.city.districtsById[id];
                return (
                  <option key={id} value={id}>
                    {d?.name ?? id} — Panic {Math.round(d?.panic ?? 0)}% Trust {Math.round(d?.trust ?? 0)}%
                  </option>
                );
              })}
            </select>
          </div>

          <div className="control-plate">
            <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>
              Urgency
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['low', 'medium', 'high'] as const).map((u) => (
                <button
                  key={u}
                  className={`btn ${draft.urgency === u ? 'btn-primary' : ''}`}
                  style={{ flex: 1, textTransform: 'capitalize' }}
                  onClick={() => setDraft({ urgency: u })}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="control-plate">
            <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>
              Message (optional)
            </label>
            <textarea
              rows={3}
              value={draft.message}
              onChange={(e) => setDraft({ message: e.target.value })}
              placeholder="Add a custom message or leave blank for default template..."
              style={{ resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          {preview && draft.actionType && (
            <div className="paper-card" style={{ padding: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Predicted Impact
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>
                {preview.description}
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ fontSize: 13 }}>
                  Trust: <span style={{ color: trustColor(preview.projectedTrustImpact), fontFamily: 'var(--font-mono)' }}>
                    {preview.projectedTrustImpact >= 0 ? '+' : ''}{preview.projectedTrustImpact}
                  </span>
                </span>
                <span style={{ fontSize: 13 }}>
                  Panic: <span style={{ color: panicColor(preview.projectedPanicImpact), fontFamily: 'var(--font-mono)' }}>
                    {preview.projectedPanicImpact >= 0 ? '+' : ''}{preview.projectedPanicImpact}
                  </span>
                </span>
                <span style={{ fontSize: 13 }}>
                  Compliance: <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    ~{preview.projectedCompliance}%
                  </span>
                </span>
              </div>
            </div>
          )}

          <button
            className="btn btn-primary"
            disabled={!draft.actionType}
            onClick={sendCommunication}
            style={{ padding: '12px', fontSize: 14, justifyContent: 'center', textTransform: 'uppercase', letterSpacing: 2 }}
          >
            Approve Transmission
          </button>
        </div>
      </div>
    </div>
  );
}
