// 左侧组件面板
import React from 'react';
import { BUILTIN_GATES } from '../engine/gates';

interface PaletteProps {
  onGateSelect: (gateId: string) => void;
}

export const Palette: React.FC<PaletteProps> = ({ onGateSelect }) => {
  return (
    <div className="w-64 bg-gray-100 border-r border-gray-300 p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">逻辑门库</h2>

      <div className="space-y-2">
        {BUILTIN_GATES.map((gate) => (
          <button
            key={gate.id}
            onClick={() => onGateSelect(gate.id)}
            className="w-full p-3 bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-400 transition-colors text-left"
          >
            <div className="font-semibold">{gate.name}</div>
            <div className="text-xs text-gray-600 mt-1">
              输入: {gate.inputs.map((p) => p.name).join(', ')}
            </div>
            <div className="text-xs text-gray-600">
              输出: {gate.outputs.map((p) => p.name).join(', ')}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold mb-2">使用说明</h3>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>• 点击逻辑门添加到画布</li>
          <li>• 拖动门可以移动位置</li>
          <li>• 点击输入按钮切换0/1</li>
          <li>• 输出会自动计算</li>
        </ul>
      </div>
    </div>
  );
};
