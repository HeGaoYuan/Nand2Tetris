import { Toolbar } from './components/Toolbar';
import { Palette } from './components/Palette';
import { Canvas } from './components/Canvas';
import { useCircuitStore } from './store/circuitStore';

function App() {
  const { addGate, circuit } = useCircuitStore();

  const handleGateSelect = (gateId: string) => {
    // 在画布中心添加门
    const centerX = window.innerWidth / 2 - 300; // 减去左侧面板宽度
    const centerY = window.innerHeight / 2 - 100;
    addGate(gateId, { x: centerX, y: centerY });
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Toolbar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Palette onGateSelect={handleGateSelect} customGates={circuit.customGates} />
        <Canvas />
      </div>
    </div>
  );
}

export default App;
