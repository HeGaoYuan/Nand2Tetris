// 连线渲染组件
import React from 'react';
import type { Wire, GateInstance } from '../types/circuit';

interface WireComponentProps {
  wire: Wire;
  gates: GateInstance[];
  selected?: boolean;
  onSelect?: () => void;
}

export const WireComponent: React.FC<WireComponentProps> = ({ wire, gates, selected = false, onSelect }) => {
  const fromGate = gates.find((g) => g.id === wire.from.gateId);
  const toGate = gates.find((g) => g.id === wire.to.gateId);

  if (!fromGate || !toGate) return null;

  const fromPin = fromGate.outputs.find((p) => p.id === wire.from.pinId);
  const toPin = toGate.inputs.find((p) => p.id === wire.to.pinId);

  if (!fromPin || !toPin) return null;

  // 判断门的类型
  const isFromIOGate = fromGate.gateDefId === 'input' || fromGate.gateDefId === 'output' || fromGate.gateDefId === 'clock';
  const isToIOGate = toGate.gateDefId === 'input' || toGate.gateDefId === 'output' || toGate.gateDefId === 'clock';

  // 计算旋转后的引脚位置
  const calculateRotatedPinPosition = (
    gate: GateInstance,
    pinIndex: number,
    isOutput: boolean,
    isIOGate: boolean
  ): { x: number; y: number } => {
    const rotation = gate.rotation || 0;

    if (isIOGate) {
      // IO门容器结构分析：
      // - 外层div: position: absolute, left: gate.position.x, top: gate.position.y
      // - 外层div: transform: rotate(${rotation}deg), transformOrigin: 'center center'
      // - flexDirection: rotation=90/270时为'row'，否则为'column'
      // - 连接点: position: absolute, left/right: -12px, top: 35px

      const iconSize = 80;
      const labelWidth = 100;
      const sequenceWidth = 100;
      const gap = 8;

      // 计算容器在当前rotation下的实际尺寸（这决定了旋转中心）
      let containerWidth: number, containerHeight: number;

      if (rotation === 90 || rotation === 270) {
        // row布局：元素横向排列
        // 图标(80) + gap(8) + 标签(100) [+ gap(8) + 序列(100)]
        const hasSequence = gate.gateDefId === 'input' || gate.gateDefId === 'clock';
        containerWidth = iconSize + gap + labelWidth + (hasSequence ? gap + sequenceWidth : 0);
        containerHeight = iconSize; // 高度主要由图标决定
      } else {
        // column布局：元素纵向排列
        const hasSequence = gate.gateDefId === 'input' || gate.gateDefId === 'clock';
        containerWidth = labelWidth; // 宽度主要由标签决定（最宽的元素）
        containerHeight = iconSize + gap + 28 + (hasSequence ? gap + 100 : 0); // 图标 + gap + 标签 + 序列
      }

      // 连接点在未旋转容器中的位置
      let pinXInContainer: number, pinYInContainer: number;

      if (gate.gateDefId === 'input') {
        if (isOutput) {
          // 右侧输出：right: -12px, top: 35px
          // right: -12px 相当于 left: containerWidth + 12
          // 但注意：flexDirection变化时，容器宽度不同
          // 连接点实际上是相对于图标的，所以我们需要找到图标在容器中的位置

          if (rotation === 90 || rotation === 270) {
            // row布局：图标在最左边
            pinXInContainer = iconSize + 12;
          } else {
            // column布局：图标居中，但连接点在图标右侧
            pinXInContainer = (containerWidth / 2) + (iconSize / 2) + 12;
          }
          pinYInContainer = 35;
        } else {
          // 左侧输入：left: -12px, top: 35px
          if (rotation === 90 || rotation === 270) {
            // row布局：图标在最左边
            pinXInContainer = -12;
          } else {
            // column布局：图标居中
            pinXInContainer = (containerWidth / 2) - (iconSize / 2) - 12;
          }
          pinYInContainer = 35;
        }
      } else if (gate.gateDefId === 'output') {
        // OUTPUT门：只有左侧输入
        if (rotation === 90 || rotation === 270) {
          pinXInContainer = -12;
        } else {
          pinXInContainer = (containerWidth / 2) - (iconSize / 2) - 12;
        }
        pinYInContainer = 35;
      } else {
        // CLOCK门：只有右侧输出
        if (rotation === 90 || rotation === 270) {
          pinXInContainer = iconSize + 12;
        } else {
          pinXInContainer = (containerWidth / 2) + (iconSize / 2) + 12;
        }
        pinYInContainer = 35;
      }

      // 容器的旋转中心（transformOrigin: 'center center'）
      const centerX = containerWidth / 2;
      const centerY = containerHeight / 2;

      // 将连接点坐标转换为相对于旋转中心的坐标
      const relativeX = pinXInContainer - centerX;
      const relativeY = pinYInContainer - centerY;

      // 应用旋转变换
      const radians = (rotation * Math.PI) / 180;
      const rotatedX = relativeX * Math.cos(radians) - relativeY * Math.sin(radians);
      const rotatedY = relativeX * Math.sin(radians) + relativeY * Math.cos(radians);

      // 转换回绝对坐标
      // gate.position 是容器左上角的位置
      // 旋转中心在容器中心，所以全局坐标是 gate.position + center + rotated_offset
      return {
        x: gate.position.x + centerX + rotatedX,
        y: gate.position.y + centerY + rotatedY,
      };
    }

    // 普通门的连接点位置
    // 普通门结构：
    // - 外层div: position: absolute, left: gate.position.x, top: gate.position.y
    // - 外层div: transform: rotate(${rotation}deg), transformOrigin: 'center center'
    // - 布局：flex横向，左侧输入列 + 中间门名称 + 右侧输出列
    // - 连接点：position: absolute, left/right: -22px（相对于引脚行）

    const padding = 12;
    const gap = 16; // 主容器的gap（输入列、门名称、输出列之间的间距）
    const pinGap = 8; // 引脚之间的gap
    const pinHeight = 24;
    const pinConnectionOffset = -22; // 连接点距离门边缘的偏移

    // 估算各部分的宽度
    const inputColumnWidth = 24 + 8 + 50; // 按钮(24) + gap(8) + 名称(约50)
    const gateNameWidth = 80; // 门名称的宽度（估算）
    const outputColumnWidth = 50 + 8 + 24; // 名称(约50) + gap(8) + 值显示(24)

    // 门的总宽度（包括padding）
    const gateWidth = padding + inputColumnWidth + gap + gateNameWidth + gap + outputColumnWidth + padding;

    // 计算门的高度
    const maxPins = Math.max(gate.inputs.length, gate.outputs.length);
    const pinsContentHeight = maxPins * pinHeight + (maxPins - 1) * pinGap;
    const gateHeight = padding * 2 + pinsContentHeight;

    // 容器的旋转中心（transformOrigin: 'center center'）
    const centerX = gateWidth / 2;
    const centerY = gateHeight / 2;

    // 计算引脚在容器中的Y坐标（未旋转状态）
    // 引脚是垂直排列的，第一个引脚从padding开始
    const pinY = padding + pinIndex * (pinHeight + pinGap) + pinHeight / 2;

    // 计算连接点在容器中的坐标（未旋转状态）
    let pinXInContainer: number, pinYInContainer: number;

    if (isOutput) {
      // 输出引脚在右侧：容器宽度 + 连接点偏移
      pinXInContainer = gateWidth + pinConnectionOffset;
      pinYInContainer = pinY;
    } else {
      // 输入引脚在左侧：连接点偏移（负值）
      pinXInContainer = pinConnectionOffset;
      pinYInContainer = pinY;
    }

    // 将连接点坐标转换为相对于旋转中心的坐标
    const relativeX = pinXInContainer - centerX;
    const relativeY = pinYInContainer - centerY;

    // 应用旋转变换
    const radians = (rotation * Math.PI) / 180;
    const rotatedX = relativeX * Math.cos(radians) - relativeY * Math.sin(radians);
    const rotatedY = relativeX * Math.sin(radians) + relativeY * Math.cos(radians);

    // 转换回绝对坐标
    // gate.position 是容器左上角，旋转中心在容器中心
    return {
      x: gate.position.x + centerX + rotatedX,
      y: gate.position.y + centerY + rotatedY,
    };
  };

  let fromX: number, fromY: number, toX: number, toY: number;

  // 直接从DOM读取引脚的实际位置
  const getPinPositionFromDOM = (gateId: string, pinId: string): { x: number; y: number } | null => {
    const pinElement = document.querySelector(`[data-gate-id="${gateId}"][data-pin-id="${pinId}"]`);
    if (!pinElement) return null;

    const rect = pinElement.getBoundingClientRect();

    // 获取内容容器的位置（带有 transform 的 div）
    const contentContainer = document.querySelector('[style*="transform: translate"]') as HTMLElement;
    if (!contentContainer) return null;

    const containerRect = contentContainer.getBoundingClientRect();

    // 引脚相对于内容容器的位置
    const relativeX = rect.left + rect.width / 2 - containerRect.left;
    const relativeY = rect.top + rect.height / 2 - containerRect.top;

    // 转换到 SVG 坐标系（SVG 的 left: -5000, top: -5000）
    // SVG 的原点 (0,0) 对应内容容器的 (-5000, -5000)
    // 所以内容容器的坐标需要加上 5000
    return {
      x: relativeX + 5000,
      y: relativeY + 5000,
    };
  };

  const fromPos = getPinPositionFromDOM(wire.from.gateId, wire.from.pinId);
  const toPos = getPinPositionFromDOM(wire.to.gateId, wire.to.pinId);

  // 如果无法从DOM读取位置（例如门还没渲染），则不显示连线
  if (!fromPos || !toPos) return null;

  fromX = fromPos.x;
  fromY = fromPos.y;
  toX = toPos.x;
  toY = toPos.y;

  // 智能避障路径算法：自动绕开所有门
  const createSmartPath = (x1: number, y1: number, x2: number, y2: number): string => {
    // 定义门的边界框（包含所有门的矩形区域）
    interface Rectangle {
      x: number;
      y: number;
      width: number;
      height: number;
    }

    // 计算门的边界框
    const getGateBoundingBox = (gate: GateInstance): Rectangle => {
      const isIOGate = gate.gateDefId === 'input' || gate.gateDefId === 'output' || gate.gateDefId === 'clock';
      const rotation = gate.rotation || 0;

      if (isIOGate) {
        // IO门的尺寸估算
        const iconSize = 80;
        const labelWidth = 100;
        const sequenceWidth = 100;
        const gap = 8;

        let width: number, height: number;
        if (rotation === 90 || rotation === 270) {
          const hasSequence = gate.gateDefId === 'input' || gate.gateDefId === 'clock';
          width = iconSize + gap + labelWidth + (hasSequence ? gap + sequenceWidth : 0);
          height = iconSize;
        } else {
          const hasSequence = gate.gateDefId === 'input' || gate.gateDefId === 'clock';
          width = labelWidth;
          height = iconSize + gap + 28 + (hasSequence ? gap + 100 : 0);
        }

        return {
          x: gate.position.x - 20 + 5000, // 添加一些边距，并转换到 SVG 坐标系
          y: gate.position.y - 20 + 5000,
          width: width + 40,
          height: height + 40,
        };
      } else {
        // 普通门的尺寸
        const gateWidth = 300;
        const maxPins = Math.max(gate.inputs.length, gate.outputs.length);
        const gateHeight = 24 + maxPins * 32;

        return {
          x: gate.position.x - 20 + 5000,
          y: gate.position.y - 20 + 5000,
          width: gateWidth + 40,
          height: gateHeight + 40,
        };
      }
    };

    // 获取所有门的边界框（排除当前连线的起点和终点门）
    const obstacles: Rectangle[] = gates
      .filter((g) => g.id !== wire.from.gateId && g.id !== wire.to.gateId)
      .map((g) => getGateBoundingBox(g));

    // 检查线段是否与矩形相交
    const lineIntersectsRect = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      rect: Rectangle
    ): boolean => {
      // 简化检查：如果线段的边界框与矩形相交
      const lineMinX = Math.min(x1, x2);
      const lineMaxX = Math.max(x1, x2);
      const lineMinY = Math.min(y1, y2);
      const lineMaxY = Math.max(y1, y2);

      return !(
        lineMaxX < rect.x ||
        lineMinX > rect.x + rect.width ||
        lineMaxY < rect.y ||
        lineMinY > rect.y + rect.height
      );
    };

    // 检查路径是否被阻挡
    const isPathBlocked = (points: { x: number; y: number }[]): boolean => {
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        for (const obstacle of obstacles) {
          if (lineIntersectsRect(p1.x, p1.y, p2.x, p2.y, obstacle)) {
            return true;
          }
        }
      }
      return false;
    };

    // 生成正交路径的候选方案
    const dx = x2 - x1;
    const extend = 30; // 延伸距离

    // 尝试多种路径方案，选择第一个不被阻挡的
    const pathOptions: { x: number; y: number }[][] = [];

    // 方案1: 简单Z字形（先水平后垂直）
    pathOptions.push([
      { x: x1, y: y1 },
      { x: x1 + extend, y: y1 },
      { x: x1 + extend, y: y2 },
      { x: x2, y: y2 },
    ]);

    // 方案2: 简单Z字形（先垂直后水平）
    pathOptions.push([
      { x: x1, y: y1 },
      { x: x1, y: y1 + extend },
      { x: x2, y: y1 + extend },
      { x: x2, y: y2 },
    ]);

    // 方案3: 中点Z字形
    if (dx > 0) {
      const midX = x1 + dx / 2;
      pathOptions.push([
        { x: x1, y: y1 },
        { x: midX, y: y1 },
        { x: midX, y: y2 },
        { x: x2, y: y2 },
      ]);
    }

    // 方案4: 从上方绕过
    const detourAbove = Math.min(y1, y2) - 60;
    pathOptions.push([
      { x: x1, y: y1 },
      { x: x1 + extend, y: y1 },
      { x: x1 + extend, y: detourAbove },
      { x: x2 - extend, y: detourAbove },
      { x: x2 - extend, y: y2 },
      { x: x2, y: y2 },
    ]);

    // 方案5: 从下方绕过
    const detourBelow = Math.max(y1, y2) + 60;
    pathOptions.push([
      { x: x1, y: y1 },
      { x: x1 + extend, y: y1 },
      { x: x1 + extend, y: detourBelow },
      { x: x2 - extend, y: detourBelow },
      { x: x2 - extend, y: y2 },
      { x: x2, y: y2 },
    ]);

    // 方案6: 从左侧绕过
    const detourLeft = Math.min(x1, x2) - 60;
    pathOptions.push([
      { x: x1, y: y1 },
      { x: x1, y: y1 + extend },
      { x: detourLeft, y: y1 + extend },
      { x: detourLeft, y: y2 - extend },
      { x: x2, y: y2 - extend },
      { x: x2, y: y2 },
    ]);

    // 方案7: 从右侧绕过
    const detourRight = Math.max(x1, x2) + 60;
    pathOptions.push([
      { x: x1, y: y1 },
      { x: x1, y: y1 + extend },
      { x: detourRight, y: y1 + extend },
      { x: detourRight, y: y2 - extend },
      { x: x2, y: y2 - extend },
      { x: x2, y: y2 },
    ]);

    // 选择第一个不被阻挡的路径
    let chosenPath = pathOptions[0];
    for (const path of pathOptions) {
      if (!isPathBlocked(path)) {
        chosenPath = path;
        break;
      }
    }

    // 将路径点转换为SVG路径字符串
    const pathCommands = chosenPath.map((point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      } else {
        return `L ${point.x} ${point.y}`;
      }
    });

    return pathCommands.join(' ');
  };

  const path = createSmartPath(fromX, fromY, toX, toY);

  // 根据选中状态和信号值设置颜色
  let wireColor: string;
  let wireWidth: number;

  if (selected) {
    // 选中时使用醒目的颜色（亮蓝色）
    wireColor = '#3b82f6';
    wireWidth = 3;
  } else {
    // 默认根据信号值设置颜色
    wireColor = fromPin.value === 1 ? '#10b981' : '#6b7280';
    wireWidth = 2;
  }

  return (
    <g>
      {/* 添加一个不可见的粗线条用于接收点击事件 */}
      <path
        d={path}
        stroke="transparent"
        strokeWidth="10"
        fill="none"
        style={{ cursor: 'pointer', pointerEvents: 'auto' }}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelect) onSelect();
        }}
      />

      {/* 实际显示的连线 */}
      <path
        d={path}
        stroke={wireColor}
        strokeWidth={wireWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transition: 'stroke 0.2s, stroke-width 0.2s',
          pointerEvents: 'none', // 让点击事件穿透到下面的粗线条
        }}
      />

      {/* 连线起点圆点 */}
      <circle
        cx={fromX}
        cy={fromY}
        r={selected ? 5 : 4}
        fill={wireColor}
        style={{
          transition: 'fill 0.2s, r 0.2s',
        }}
      />

      {/* 连线终点圆点 */}
      <circle
        cx={toX}
        cy={toY}
        r={selected ? 5 : 4}
        fill={wireColor}
        style={{
          transition: 'fill 0.2s, r 0.2s',
        }}
      />
    </g>
  );
};
