import { useState, useEffect } from 'react';
import { useCityWatchStore } from '../../store/gameStore';
import type { KeyRunEvent } from '../../types';

interface Toast {
  id: string;
  event: KeyRunEvent;
  visible: boolean;
}

const TYPE_COLORS: Record<KeyRunEvent['type'], string> = {
  incident: '#ff7020',
  action: '#40c880',
  entity: '#ff4040',
  system: '#60a0e0',
};

const TYPE_ICONS: Record<KeyRunEvent['type'], string> = {
  incident: '⚠',
  action: '📡',
  entity: '👁',
  system: 'ℹ',
};

export default function ToastNotificationStack() {
  const keyEvents = useCityWatchStore((s) => s.keyEvents);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [seenCount, setSeenCount] = useState(0);

  useEffect(() => {
    if (keyEvents.length <= seenCount) return;
    const newEvents = keyEvents.slice(seenCount);
    setSeenCount(keyEvents.length);

    for (const event of newEvents) {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [{ id, event, visible: true }, ...prev].slice(0, 5));

      setTimeout(() => {
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, visible: false } : t)));
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 500);
      }, 4000);
    }
  }, [keyEvents, seenCount]);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: 56,
      right: 12,
      display: 'flex',
      flexDirection: 'column-reverse',
      gap: 6,
      zIndex: 100,
      pointerEvents: 'none',
      maxWidth: 320,
    }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            background: 'var(--bg-panel)',
            border: `1px solid ${TYPE_COLORS[toast.event.type]}`,
            borderRadius: 6,
            padding: '8px 12px',
            animation: toast.visible ? 'slideIn 0.25s ease' : 'fadeOut 0.4s ease forwards',
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
          }}
        >
          <span style={{ color: TYPE_COLORS[toast.event.type], fontSize: 14, flexShrink: 0, marginTop: 1 }}>
            {TYPE_ICONS[toast.event.type]}
          </span>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {toast.event.description}
            </div>
            {toast.event.districtId && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                {toast.event.districtId}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
