// 中间画布区域
import React from 'react';
import { useCircuitStore } from '../store/circuitStore';
import { GateComponent } from './GateComponent';

export const Canvas: React.FC = () => {
  const {
    circuit,
    selectedGateId,
    selectGate,
    moveGate,
    setGateInput,
    removeGate,
  } = useCircuitStore();

  const handleCanvasClick = (e: React.MouseEvent) => {
    // 点击空白处取消选择
    if (e.target === e.currentTarget) {
      selectGate(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 删除选中的门
    if (e.key === 'Delete' && selectedGateId) {
      removeGate(selectedGateId);
      selectGate(null);
    }
  };

  return (
    <div
      className="flex-1 bg-gray-50 relative overflow-hidden"
      onClick={handleCanvasClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* 网格背景 */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />

      {/* 渲染所有门 */}
      {circuit.gates.map((gate) => (
        <GateComponent
          key={gate.id}
          gate={gate}
          selected={gate.id === selectedGateId}
          onSelect={() => selectGate(gate.id)}
          onMove={(position) => moveGate(gate.id, position)}
          onInputChange={(inputIndex, value) =>
            setGateInput(gate.id, inputIndex, value)
          }
        />
      ))}

      {/* 提示信息 */}
      {circuit.gates.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <p className="text-2xl mb-2">点击左侧逻辑门添加到画布</p>
            <p className="text-lg">开始构建你的数字电路!</p>
          </div>
        </div>
      )}
    </div>
  );
};
