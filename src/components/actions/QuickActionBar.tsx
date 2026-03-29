import { useCityWatchStore } from '../../store/gameStore';
import type { CommunicationActionType, TimeSpeed } from '../../types';
import { COMM_TYPE_LABELS } from '../../data/cityData';

const QUICK_ACTIONS: { type: CommunicationActionType; icon: string; label: string }[] = [
  { type: 'district_alert', icon: '⚡', label: 'Alert' },
  { type: 'targeted_text', icon: '✉', label: 'Text' },
  { type: 'responder_tip', icon: '🚓', label: 'Tip' },
  { type: 'transit_notice', icon: '🚌', label: 'Transit' },
  { type: 'building_alarm', icon: '🔔', label: 'Alarm' },
];

const TIME_SPEEDS: { speed: TimeSpeed; label: string }[] = [
  { speed: 'paused', label: '⏸' },
  { speed: 'slow', label: '▶' },
  { speed: 'normal', label: '▶▶' },
  { speed: 'fast', label: '▶▶▶' },
];

export default function QuickActionBar() {
  const ui = useCityWatchStore((s) => s.ui);
  const setUI = useCityWatchStore((s) => s.setUI);
  const setDraft = useCityWatchStore((s) => s.setDraft);
  const setTimeSpeed = useCityWatchStore((s) => s.setTimeSpeed);
  const selectedDistrictId = ui.selectedDistrictId;
  const districtsById = useCityWatchStore((s) => s.game.city.districtsById);

  const handleQuickAction = (type: CommunicationActionType) => {
    setDraft({ actionType: type, targetDistrictId: selectedDistrictId ?? null });
    setUI({ isCommunicationsDrawerOpen: true, activeCommunicationType: type });
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 12px',
      background: 'var(--bg-elevated)',
      borderTop: '1px solid var(--border)',
      flexShrink: 0,
      flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginRight: 4 }}>
        Actions
      </span>

      {QUICK_ACTIONS.map((a) => (
        <button
          key={a.type}
          className="btn btn-sm"
          title={COMM_TYPE_LABELS[a.type]}
          onClick={() => handleQuickAction(a.type)}
        >
          <span>{a.icon}</span>
          <span>{a.label}</span>
          {selectedDistrictId && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              ({districtsById[selectedDistrictId]?.name ?? selectedDistrictId})
            </span>
          )}
        </button>
      ))}

      <div style={{ flex: 1 }} />

      <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2 }}>
        Speed
      </span>
      {TIME_SPEEDS.map((t) => (
        <button
          key={t.speed}
          className={`btn btn-sm ${ui.timeSpeed === t.speed ? 'btn-primary' : ''}`}
          onClick={() => setTimeSpeed(t.speed)}
          title={t.speed}
          style={{ minWidth: 36, fontFamily: 'var(--font-mono)', fontSize: 13 }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
