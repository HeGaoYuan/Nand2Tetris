// 芯片内部视图组件 - 显示自定义芯片的内部实现
import React from 'react';
import type { GateDefinition, GateInstance, Wire, BitValue } from '../types/circuit';
import { ALL_GATES } from '../engine/gates';

interface ChipInternalViewProps {
  gateDef: GateDefinition;
  currentInputs: BitValue[]; // 当前输入值
  customGates: GateDefinition[]; // 所有自定义门的列表
  onClose: () => void;
}

export const ChipInternalView: React.FC<ChipInternalViewProps> = ({
  gateDef,
  currentInputs,
  customGates,
  onClose,
}) => {
  if (!gateDef.internalCircuit) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }}
        onClick={onClose}
      >
        <div
          style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '400px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3>无法查看内部实现</h3>
          <p>该芯片没有保存内部电路结构。</p>
          <button
            onClick={onClose}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            关闭
          </button>
        </div>
      </div>
    );
  }

  // 计算内部门的实时状态
  const [internalGates, setInternalGates] = React.useState<GateInstance[]>([]);
  const { internalCircuit } = gateDef;

  React.useEffect(() => {
    // 创建内部电路的副本并模拟信号传播
    const gates = internalCircuit.gates.map((g) => {
      if (g.gateDefId === 'input') {
        // 将外部输入值传递给 INPUT 门
        const inputIndex = internalCircuit.inputGateIds.indexOf(g.id);
        const inputValue = currentInputs[inputIndex] || 0;
        return {
          ...g,
          inputs: g.inputs.map((pin) => ({ ...pin, value: inputValue as BitValue })),
          outputs: g.outputs.map((pin) => ({ ...pin, value: inputValue as BitValue })),
        };
      }
      return { ...g };
    });

    // 运行模拟（最多 10 次迭代）
    for (let iteration = 0; iteration < 10; iteration++) {
      let changed = false;

      // 沿着连线传播信号
      internalCircuit.wires.forEach((wire) => {
        const fromGate = gates.find((g) => g.id === wire.from.gateId);
        const toGate = gates.find((g) => g.id === wire.to.gateId);

        if (!fromGate || !toGate) return;

        const outputPin = fromGate.outputs.find((p) => p.id === wire.from.pinId);
        const inputPinIndex = toGate.inputs.findIndex((p) => p.id === wire.to.pinId);

        if (outputPin && inputPinIndex >= 0) {
          const currentValue = toGate.inputs[inputPinIndex].value;
          if (currentValue !== outputPin.value) {
            toGate.inputs[inputPinIndex] = {
              ...toGate.inputs[inputPinIndex],
              value: outputPin.value,
            };
            changed = true;
          }
        }
      });

      // 计算所有门的输出
      gates.forEach((gate) => {
        if (gate.gateDefId === 'input' || gate.gateDefId === 'output') return;

        const subGateDef = [...ALL_GATES, gateDef].find((def) => def.id === gate.gateDefId);

        if (!subGateDef || subGateDef.type === 'sequential') return;

        const inputValues = gate.inputs.map((pin) => pin.value) as BitValue[];
        const outputValues = subGateDef.compute(inputValues);

        outputValues.forEach((val, idx) => {
          if (gate.outputs[idx] && gate.outputs[idx].value !== val) {
            gate.outputs[idx] = { ...gate.outputs[idx], value: val as BitValue };
            changed = true;
          }
        });
      });

      if (!changed) break;
    }

    setInternalGates(gates);
  }, [currentInputs, gateDef, internalCircuit]);

  // 计算布局（简单的自动布局）
  const gatePositions = React.useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();

    // 使用保存的位置信息
    internalCircuit.gates.forEach((gate) => {
      if (gate.position) {
        positions.set(gate.id, gate.position);
      }
    });

    return positions;
  }, [internalCircuit]);

  // 获取门的显示名称（包括自定义芯片）
  const getGateName = (gate: GateInstance) => {
    if (gate.label) return gate.label;

    // 先从内置门中查找
    const builtinGateDef = ALL_GATES.find((def) => def.id === gate.gateDefId);
    if (builtinGateDef) return builtinGateDef.name;

    // 再从自定义门列表中查找
    const customGateDef = customGates.find((def) => def.id === gate.gateDefId);
    if (customGateDef) return customGateDef.name;

    // 如果都找不到，返回门的ID
    return gate.gateDefId;
  };

  // 计算画布边界
  const { minX, minY, maxX, maxY } = React.useMemo(() => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    internalCircuit.gates.forEach((gate) => {
      const pos = gatePositions.get(gate.id);
      if (pos) {
        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x);
        maxY = Math.max(maxY, pos.y);
      }
    });

    return {
      minX: minX - 50,
      minY: minY - 50,
      maxX: maxX + 150,
      maxY: maxY + 150,
    };
  }, [gatePositions, internalCircuit]);

  const width = maxX - minX;
  const height = maxY - minY;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '2px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f9fafb',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
              🔍 内部实现：{gateDef.name}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
              当前输入: [{currentInputs.join(', ')}]
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
          >
            ✕ 关闭
          </button>
        </div>

        {/* 电路视图 */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '24px',
            backgroundColor: '#f3f4f6',
          }}
        >
          <svg
            width={Math.max(800, width)}
            height={Math.max(600, height)}
            style={{
              backgroundColor: 'white',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
            }}
          >
            {/* 绘制连线 */}
            {internalCircuit.wires.map((wire) => {
              const fromGate = internalGates.find((g) => g.id === wire.from.gateId);
              const toGate = internalGates.find((g) => g.id === wire.to.gateId);
              const fromPos = gatePositions.get(wire.from.gateId);
              const toPos = gatePositions.get(wire.to.gateId);

              if (!fromGate || !toGate || !fromPos || !toPos) return null;

              // 找到输出引脚的索引
              const outputPinIndex = fromGate.outputs.findIndex((p) => p.id === wire.from.pinId);
              const inputPinIndex = toGate.inputs.findIndex((p) => p.id === wire.to.pinId);

              if (outputPinIndex < 0 || inputPinIndex < 0) return null;

              const outputPin = fromGate.outputs[outputPinIndex];
              const isActive = outputPin?.value === 1;

              // 计算引脚的实际位置
              // 门的宽度是100px，高度是80px
              // 输出引脚在右侧 (x + 100)，输入引脚在左侧 (x)
              // 引脚的Y坐标是 y + 20 + idx * 20
              const x1 = fromPos.x - minX + 100; // 输出引脚在门的右边缘
              const y1 = fromPos.y - minY + 20 + outputPinIndex * 20;
              const x2 = toPos.x - minX; // 输入引脚在门的左边缘
              const y2 = toPos.y - minY + 20 + inputPinIndex * 20;

              return (
                <line
                  key={wire.id}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isActive ? '#ef4444' : '#9ca3af'}
                  strokeWidth={isActive ? 3 : 2}
                  opacity={isActive ? 1 : 0.5}
                />
              );
            })}

            {/* 绘制门 */}
            {internalGates.map((gate) => {
              const pos = gatePositions.get(gate.id);
              if (!pos) return null;

              const x = pos.x - minX;
              const y = pos.y - minY;
              const gateName = getGateName(gate);
              const isIOGate = gate.gateDefId === 'input' || gate.gateDefId === 'output';

              return (
                <g key={gate.id}>
                  {/* 门的矩形 */}
                  <rect
                    x={x}
                    y={y}
                    width={100}
                    height={80}
                    fill={isIOGate ? '#dbeafe' : '#fff'}
                    stroke={isIOGate ? '#3b82f6' : '#6b7280'}
                    strokeWidth={2}
                    rx={4}
                  />

                  {/* 门的名称 */}
                  <text
                    x={x + 50}
                    y={y + 35}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="bold"
                    fill="#1f2937"
                  >
                    {gateName}
                  </text>

                  {/* 输入引脚 */}
                  {gate.inputs.map((pin, idx) => {
                    const pinY = y + 20 + idx * 20;
                    return (
                      <g key={pin.id}>
                        <circle
                          cx={x}
                          cy={pinY}
                          r={4}
                          fill={pin.value === 1 ? '#ef4444' : '#9ca3af'}
                          stroke="#1f2937"
                          strokeWidth={1}
                        />
                        <text
                          x={x + 8}
                          y={pinY + 4}
                          fontSize="10"
                          fill={pin.value === 1 ? '#ef4444' : '#6b7280'}
                          fontWeight="bold"
                        >
                          {pin.value}
                        </text>
                      </g>
                    );
                  })}

                  {/* 输出引脚 */}
                  {gate.outputs.map((pin, idx) => {
                    const pinY = y + 20 + idx * 20;
                    return (
                      <g key={pin.id}>
                        <circle
                          cx={x + 100}
                          cy={pinY}
                          r={4}
                          fill={pin.value === 1 ? '#ef4444' : '#9ca3af'}
                          stroke="#1f2937"
                          strokeWidth={1}
                        />
                        <text
                          x={x + 85}
                          y={pinY + 4}
                          fontSize="10"
                          fill={pin.value === 1 ? '#ef4444' : '#6b7280'}
                          fontWeight="bold"
                          textAnchor="end"
                        >
                          {pin.value}
                        </text>
                      </g>
                    );
                  })}

                  {/* 输出值显示（在门的中心） */}
                  <text
                    x={x + 50}
                    y={y + 55}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#6b7280"
                  >
                    {gate.outputs.map((p) => p.value).join(',')}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 说明栏 */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            fontSize: '12px',
            color: '#6b7280',
          }}
        >
          <p style={{ margin: 0 }}>
            💡 <strong>说明：</strong>红色表示高电平(1)，灰色表示低电平(0)。
            输入: {gateDef.inputs.length} 个 | 输出: {gateDef.outputs.length} 个 | 内部门: {internalCircuit.gates.length} 个 | 连线: {internalCircuit.wires.length} 条
          </p>
        </div>
      </div>
    </div>
  );
};
