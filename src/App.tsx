import { useCityWatchStore } from './store/gameStore';
import BriefingScreen from './components/summary/BriefingScreen';
import OperationsScreen from './components/OperationsScreen';
import SummaryScreen from './components/summary/SummaryScreen';

export default function App() {
  const screen = useCityWatchStore((s) => s.screen);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {screen === 'briefing' && <BriefingScreen />}
      {screen === 'operations' && <OperationsScreen />}
      {screen === 'summary' && <SummaryScreen />}
    </div>
  );
}
