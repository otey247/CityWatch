import { useState, useEffect, useRef } from 'react';
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
  // Use a ref for seenCount to avoid StrictMode double-fire of the effect
  const seenCountRef = useRef(0);
  // Track all scheduled timeout IDs so we can clear them on unmount
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearScheduledTimeouts = () => {
    for (const id of timeoutIdsRef.current) clearTimeout(id);
    timeoutIdsRef.current = [];
  };
  const releaseTimeoutId = (timeoutId: ReturnType<typeof setTimeout>) => {
    timeoutIdsRef.current = timeoutIdsRef.current.filter((id) => id !== timeoutId);
  };

  useEffect(() => {
    if (keyEvents.length <= seenCountRef.current) return;
    const newEvents = keyEvents.slice(seenCountRef.current);
    seenCountRef.current = keyEvents.length;

    for (const event of newEvents) {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [{ id, event, visible: true }, ...prev].slice(0, 5));

      const fadeId = setTimeout(() => {
        releaseTimeoutId(fadeId);
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, visible: false } : t)));
        const removeId = setTimeout(() => {
          releaseTimeoutId(removeId);
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 500);

        timeoutIdsRef.current.push(removeId);
      }, 4000);
      timeoutIdsRef.current.push(fadeId);
    }
  }, [keyEvents]);

  // Clear all pending timeouts when the component unmounts
  useEffect(() => {
    return () => clearScheduledTimeouts();
  }, []);

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
            background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.12)), var(--bg-panel)',
            border: `1px solid ${TYPE_COLORS[toast.event.type]}`,
            borderRadius: 0,
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
