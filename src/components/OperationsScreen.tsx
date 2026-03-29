import { useEffect, useRef } from 'react';
import { useCityWatchStore } from '../store/gameStore';
import TopStatusBar from './layout/TopStatusBar';
import IncidentFeedPanel from './feed/IncidentFeedPanel';
import CityMapPanel from './map/CityMapPanel';
import ContextPanel from './context/ContextPanel';
import QuickActionBar from './actions/QuickActionBar';
import CommunicationsDrawer from './comms/CommunicationsDrawer';
import ToastNotificationStack from './layout/ToastNotificationStack';

const TICK_INTERVAL_MS = 200; // UI tick rate
const SPEED_MULTIPLIERS = {
  paused: 0,
  slow: 0.5,
  normal: 2,
  fast: 6,
};

export default function OperationsScreen() {
  const advanceTick = useCityWatchStore((s) => s.advanceTick);
  const timeSpeed = useCityWatchStore((s) => s.ui.timeSpeed);
  const lastTickRef = useRef(Date.now());

  // Game loop
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const realDelta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      const multiplier = SPEED_MULTIPLIERS[timeSpeed];
      if (multiplier > 0) {
        advanceTick(realDelta * multiplier);
      }
    }, TICK_INTERVAL_MS);

    return () => clearInterval(id);
  }, [timeSpeed, advanceTick]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-base)',
      position: 'relative',
    }}>
      {/* Top bar */}
      <TopStatusBar />

      {/* Main layout: feed | map | context */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '260px 1fr 260px',
        gap: 6,
        padding: 6,
        minHeight: 0,
        overflow: 'hidden',
      }}>
        <IncidentFeedPanel />
        <CityMapPanel />
        <ContextPanel />
      </div>

      {/* Bottom action bar */}
      <QuickActionBar />

      {/* Overlays */}
      <CommunicationsDrawer />
      <ToastNotificationStack />
    </div>
  );
}
