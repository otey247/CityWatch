import { useCityWatchStore } from '../../store/gameStore';
import type { CommunicationActionType, TimeSpeed } from '../../types';
import { COMM_TYPE_LABELS } from '../../data/cityData';

const QUICK_ACTIONS: { type: CommunicationActionType; code: string; label: string }[] = [
  { type: 'district_alert', code: 'R-01', label: 'Review Alert' },
  { type: 'targeted_text', code: 'R-02', label: 'Route Text' },
  { type: 'responder_tip', code: 'R-03', label: 'Dispatch Tip' },
  { type: 'transit_notice', code: 'R-04', label: 'Transit Notice' },
  { type: 'building_alarm', code: 'R-05', label: 'Building Alarm' },
];

const TIME_SPEEDS: { speed: TimeSpeed; label: string }[] = [
  { speed: 'paused', label: 'Hold' },
  { speed: 'slow', label: 'Review' },
  { speed: 'normal', label: 'Process' },
  { speed: 'fast', label: 'Escalate' },
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
    <div className="panel" style={{ flexShrink: 0 }}>
      <div className="panel-header">
        <span>Mechanical Command Console</span>
        <span style={{ color: 'var(--text-muted)' }}>Target Sector: {selectedDistrictId ? districtsById[selectedDistrictId]?.name ?? selectedDistrictId : 'Unassigned'}</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gap: 10,
        padding: 12,
        alignItems: 'start',
      }}>
        <div className="control-plate">
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 8 }}>
            Routing Buttons
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 8 }}>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.type}
                className="btn"
                title={COMM_TYPE_LABELS[action.type]}
                onClick={() => handleQuickAction(action.type)}
                style={{ flexDirection: 'column', alignItems: 'flex-start', minHeight: 58, padding: 8 }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>{action.code}</span>
                <span style={{ fontSize: 11, lineHeight: 1.3, textAlign: 'left' }}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="control-plate" style={{ minWidth: 248 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 8 }}>
            Phase Selector
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
            {TIME_SPEEDS.map((time) => (
              <button
                key={time.speed}
                className={`btn btn-sm ${ui.timeSpeed === time.speed ? 'btn-primary' : ''}`}
                onClick={() => setTimeSpeed(time.speed)}
                title={time.speed}
                style={{ minWidth: 0 }}
              >
                {time.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
