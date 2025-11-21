// 顶部工具栏
import React from 'react';
import { useCircuitStore } from '../store/circuitStore';

export const Toolbar: React.FC = () => {
  const { stepSimulation, resetSimulation, circuit } = useCircuitStore();

  return (
    <div className="h-16 bg-white border-b border-gray-300 flex items-center px-6 gap-4">
      <h1 className="text-xl font-bold text-gray-800">数字逻辑仿真器</h1>

      <div className="flex-1" />

      <div className="flex gap-2">
        <button
          onClick={stepSimulation}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          执行一步
        </button>

        <button
          onClick={resetSimulation}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          重置
        </button>
      </div>

      <div className="text-sm text-gray-600">
        门数量: {circuit.gates.length} | 连线: {circuit.wires.length}
      </div>
    </div>
  );
};
