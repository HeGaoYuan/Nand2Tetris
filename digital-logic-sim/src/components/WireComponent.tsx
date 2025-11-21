// 连线渲染组件
import React from 'react';
import type { Wire, GateInstance } from '../types/circuit';

interface WireComponentProps {
  wire: Wire;
  gates: GateInstance[];
}

export const WireComponent: React.FC<WireComponentProps> = ({ wire, gates }) => {
  const fromGate = gates.find((g) => g.id === wire.from.gateId);
  const toGate = gates.find((g) => g.id === wire.to.gateId);

  if (!fromGate || !toGate) return null;

  const fromPin = fromGate.outputs.find((p) => p.id === wire.from.pinId);
  const toPin = toGate.inputs.find((p) => p.id === wire.to.pinId);

  if (!fromPin || !toPin) return null;

  // 判断门的类型
  const isFromIOGate = fromGate.gateDefId === 'input' || fromGate.gateDefId === 'output';
  const isToIOGate = toGate.gateDefId === 'input' || toGate.gateDefId === 'output';

  let fromX: number, fromY: number, toX: number, toY: number;

  // 计算起点位置（输出引脚）
  if (isFromIOGate) {
    // IO门：连接点在图标右侧或左侧中心
    if (fromGate.gateDefId === 'input') {
      fromX = fromGate.position.x + 80 + 4; // 图标宽度80 + 连接点半径偏移
      fromY = fromGate.position.y + 40; // 图标中心
    } else {
      fromX = fromGate.position.x - 4;
      fromY = fromGate.position.y + 40;
    }
  } else {
    // 普通门：横向布局，输出在右侧
    const fromPinIndex = fromGate.outputs.findIndex((p) => p.id === wire.from.pinId);
    const gateHeight = Math.max(fromGate.inputs.length, fromGate.outputs.length) * 32;
    const outputsStartY = 12 + (gateHeight - fromGate.outputs.length * 32) / 2;
    fromX = fromGate.position.x + 160 + 16 + 6; // 门宽度 + padding + 连接点半径
    fromY = fromGate.position.y + outputsStartY + (fromPinIndex * 32) + 12; // 引脚位置
  }

  // 计算终点位置（输入引脚）
  if (isToIOGate) {
    // IO门：连接点在图标左侧或右侧中心
    if (toGate.gateDefId === 'output') {
      toX = toGate.position.x - 4;
      toY = toGate.position.y + 40;
    } else {
      toX = toGate.position.x + 80 + 4;
      toY = toGate.position.y + 40;
    }
  } else {
    // 普通门：横向布局，输入在左侧
    const toPinIndex = toGate.inputs.findIndex((p) => p.id === wire.to.pinId);
    const gateHeight = Math.max(toGate.inputs.length, toGate.outputs.length) * 32;
    const inputsStartY = 12 + (gateHeight - toGate.inputs.length * 32) / 2;
    toX = toGate.position.x - 6; // 连接点半径
    toY = toGate.position.y + inputsStartY + (toPinIndex * 32) + 12; // 引脚位置
  }

  // 计算控制点以创建曲线
  const midX = (fromX + toX) / 2;
  const path = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;

  // 根据信号值设置颜色
  const wireColor = fromPin.value === 1 ? '#10b981' : '#6b7280';

  return (
    <g>
      <path
        d={path}
        stroke={wireColor}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        style={{
          transition: 'stroke 0.2s'
        }}
      />
    </g>
  );
};
