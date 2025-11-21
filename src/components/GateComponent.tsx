// 逻辑门UI组件
import React from 'react';
import { GateInstance } from '../types/circuit';
import { BUILTIN_GATES } from '../engine/gates';

interface GateComponentProps {
  gate: GateInstance;
  selected: boolean;
  onSelect: () => void;
  onMove: (position: { x: number; y: number }) => void;
  onInputChange: (inputIndex: number, value: 0 | 1) => void;
}

export const GateComponent: React.FC<GateComponentProps> = ({
  gate,
  selected,
  onSelect,
  onMove,
  onInputChange,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

  const gateDef = BUILTIN_GATES.find((g) => g.id === gate.gateDefId);
  if (!gateDef) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - gate.position.x,
      y: e.clientY - gate.position.y,
    });
    onSelect();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      onMove({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        onMove({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, dragStart, onMove]);

  return (
    <div
      className={`absolute bg-white border-2 rounded-lg p-4 cursor-move select-none ${
        selected ? 'border-blue-500 shadow-lg' : 'border-gray-300'
      }`}
      style={{
        left: `${gate.position.x}px`,
        top: `${gate.position.y}px`,
        minWidth: '120px',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* 门名称 */}
      <div className="text-center font-bold text-lg mb-2">{gateDef.name}</div>

      {/* 输入引脚 */}
      <div className="space-y-2">
        {gate.inputs.map((pin, index) => (
          <div key={pin.id} className="flex items-center gap-2">
            <button
              className={`w-6 h-6 rounded border ${
                pin.value === 1 ? 'bg-green-500' : 'bg-gray-300'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onInputChange(index, pin.value === 1 ? 0 : 1);
              }}
            >
              {pin.value}
            </button>
            <span className="text-sm">{pin.name}</span>
          </div>
        ))}
      </div>

      {/* 输出引脚 */}
      <div className="mt-3 pt-3 border-t space-y-2">
        {gate.outputs.map((pin) => (
          <div key={pin.id} className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded border flex items-center justify-center ${
                pin.value === 1 ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              {pin.value}
            </div>
            <span className="text-sm">{pin.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
