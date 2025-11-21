import React from 'react';
import { Toolbar } from './components/Toolbar';
import { Palette } from './components/Palette';
import { Canvas } from './components/Canvas';
import { useCircuitStore } from './store/circuitStore';

function App() {
  const { addGate } = useCircuitStore();

  const handleGateSelect = (gateId: string) => {
    // 在画布中心添加门
    const centerX = window.innerWidth / 2 - 300; // 减去左侧面板宽度
    const centerY = window.innerHeight / 2 - 100;
    addGate(gateId, { x: centerX, y: centerY });
  };

  return (
    <div className="h-screen flex flex-col">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <Palette onGateSelect={handleGateSelect} />
        <Canvas />
      </div>
    </div>
  );
}

export default App;
