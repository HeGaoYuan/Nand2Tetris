// 逻辑门UI组件
import React from 'react';
import type { GateInstance } from '../types/circuit';
import { ALL_GATES } from '../engine/gates';
import { useCircuitStore } from '../store/circuitStore';
import { SequenceEditorDialog } from './SequenceEditorDialog';

interface GateComponentProps {
  gate: GateInstance;
  selected: boolean;
  onSelect: () => void;
  onMove: (position: { x: number; y: number }) => void;
  onInputChange: (inputIndex: number, value: 0 | 1) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onPinClick?: (gateId: string, pinId: string, isOutput: boolean) => void;
}

export const GateComponent: React.FC<GateComponentProps> = ({
  gate,
  selected,
  onSelect,
  onMove,
  onInputChange,
  onContextMenu,
  onPinClick,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [isEditingLabel, setIsEditingLabel] = React.useState(false);
  const [labelInput, setLabelInput] = React.useState(gate.label || '');
  const [isEditingSequence, setIsEditingSequence] = React.useState(false);
  const { circuit, updateGateLabel, updateGateSequence } = useCircuitStore();
  const waveformContainerRef = React.useRef<HTMLDivElement>(null);

  const gateDef = [...ALL_GATES, ...circuit.customGates].find((g) => g.id === gate.gateDefId);
  if (!gateDef) return null;

  const isIOGate = gate.gateDefId === 'input' || gate.gateDefId === 'output' || gate.gateDefId === 'clock';

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - gate.position.x,
      y: e.clientY - gate.position.y,
    });
    onSelect();
  };

  const handleLabelDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isIOGate) {
      setIsEditingLabel(true);
      setLabelInput(gate.label || '');
    }
  };

  const handleLabelBlur = () => {
    setIsEditingLabel(false);
    const trimmedLabel = labelInput.trim();
    if (trimmedLabel && trimmedLabel !== gate.label) {
      updateGateLabel(gate.id, trimmedLabel);
    }
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLabelBlur();
    } else if (e.key === 'Escape') {
      setIsEditingLabel(false);
      setLabelInput(gate.label || '');
    }
  };

  React.useEffect(() => {
    if (!isDragging) return;

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
  }, [isDragging, dragStart, onMove]);

  // 自动滚动到当前虚线位置
  React.useEffect(() => {
    if (!waveformContainerRef.current || !gate.sequence) return;

    const container = waveformContainerRef.current;
    const currentStep = circuit.clockStep || 0;
    const bits = gate.sequence.split('');
    const idleWidth = 12;
    const edgeWidth = 15;

    // 计算虚线的X坐标
    let currentX;
    if (currentStep === 0) {
      currentX = idleWidth / 2;
    } else {
      currentX = idleWidth + (currentStep - 1) * edgeWidth + edgeWidth * 0.5;
    }

    // 滚动到虚线位置（居中显示）
    const containerWidth = container.clientWidth;
    const scrollLeft = currentX - containerWidth / 2;
    container.scrollLeft = Math.max(0, scrollLeft);
  }, [circuit.clockStep, gate.sequence]);

  // 特殊渲染 INPUT/OUTPUT 门
  if (isIOGate) {
    return (
      <div
        style={{
          position: 'absolute',
          left: `${gate.position.x}px`,
          top: `${gate.position.y}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
        onContextMenu={onContextMenu}
      >
        {/* 图标区域 */}
        <div
          style={{
            width: '80px',
            height: '80px',
            backgroundColor: 'white',
            border: selected ? '2px solid #3b82f6' : '2px solid #d1d5db',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: selected ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s',
            cursor: gate.gateDefId === 'input' ? 'pointer' : 'default',
          }}
          onClick={(e) => {
            if (gate.gateDefId === 'input' && !gate.sequence) {
              // 只有没有序列的 INPUT 门可以手动切换
              e.stopPropagation();
              onInputChange(0, gate.inputs[0]?.value === 1 ? 0 : 1);
            }
          }}
          title={
            gate.gateDefId === 'input' && !gate.sequence
              ? '点击切换开关'
              : gate.gateDefId === 'clock'
              ? '时钟信号源（由序列控制）'
              : ''
          }
        >
          {gate.gateDefId === 'input' ? (
            // 开关图标
            <div style={{ position: 'relative', width: '50px', height: '50px' }}>
              <svg width="50" height="50" viewBox="0 0 50 50">
                {/* 开关底座 */}
                <rect x="10" y="30" width="30" height="8" rx="4" fill="#94a3b8" />
                {/* 开关拨杆 */}
                <rect
                  x={gate.outputs[0]?.value === 1 ? "26" : "14"}
                  y="20"
                  width="10"
                  height="18"
                  rx="5"
                  fill={gate.outputs[0]?.value === 1 ? "#10b981" : "#6b7280"}
                  style={{ transition: 'all 0.3s ease' }}
                />
                {/* 指示灯 */}
                <circle
                  cx={gate.outputs[0]?.value === 1 ? "31" : "19"}
                  cy="23"
                  r="3"
                  fill={gate.outputs[0]?.value === 1 ? "#22c55e" : "#475569"}
                  style={{ transition: 'all 0.3s ease' }}
                >
                  {gate.outputs[0]?.value === 1 && (
                    <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />
                  )}
                </circle>
              </svg>
            </div>
          ) : gate.gateDefId === 'clock' ? (
            // 时钟图标
            <div style={{ position: 'relative', width: '50px', height: '50px' }}>
              <svg width="50" height="50" viewBox="0 0 50 50">
                {/* 时钟外圈 */}
                <circle
                  cx="25"
                  cy="25"
                  r="18"
                  fill="white"
                  stroke={gate.outputs[0]?.value === 1 ? "#3b82f6" : "#6b7280"}
                  strokeWidth="3"
                  style={{ transition: 'all 0.3s ease' }}
                />
                {/* 时钟刻度 */}
                <line x1="25" y1="9" x2="25" y2="12" stroke="#9ca3af" strokeWidth="2" />
                <line x1="25" y1="38" x2="25" y2="41" stroke="#9ca3af" strokeWidth="2" />
                <line x1="9" y1="25" x2="12" y2="25" stroke="#9ca3af" strokeWidth="2" />
                <line x1="38" y1="25" x2="41" y2="25" stroke="#9ca3af" strokeWidth="2" />
                {/* 时针（短针）*/}
                <line
                  x1="25"
                  y1="25"
                  x2="25"
                  y2="17"
                  stroke={gate.outputs[0]?.value === 1 ? "#3b82f6" : "#6b7280"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{ transition: 'all 0.3s ease' }}
                />
                {/* 分针（长针）*/}
                <line
                  x1="25"
                  y1="25"
                  x2="32"
                  y2="25"
                  stroke={gate.outputs[0]?.value === 1 ? "#3b82f6" : "#6b7280"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{ transition: 'all 0.3s ease' }}
                />
                {/* 中心点 */}
                <circle cx="25" cy="25" r="2.5" fill={gate.outputs[0]?.value === 1 ? "#3b82f6" : "#6b7280"} />
              </svg>
            </div>
          ) : (
            // 灯泡图标
            <div style={{ position: 'relative', width: '50px', height: '50px' }}>
              <svg width="50" height="50" viewBox="0 0 50 50">
                {/* 灯泡玻璃 */}
                <ellipse
                  cx="25"
                  cy="20"
                  rx="12"
                  ry="15"
                  fill={gate.inputs[0]?.value === 1 ? "#fbbf24" : "#e5e7eb"}
                  stroke="#94a3b8"
                  strokeWidth="2"
                  style={{ transition: 'all 0.3s ease' }}
                />
                {/* 灯泡发光效果 */}
                {gate.inputs[0]?.value === 1 && (
                  <>
                    <ellipse cx="25" cy="20" rx="15" ry="18" fill="#fbbf24" opacity="0.3">
                      <animate attributeName="opacity" values="0.3;0.1;0.3" dur="1s" repeatCount="indefinite" />
                    </ellipse>
                    <ellipse cx="25" cy="20" rx="18" ry="21" fill="#fbbf24" opacity="0.15">
                      <animate attributeName="opacity" values="0.15;0.05;0.15" dur="1s" repeatCount="indefinite" />
                    </ellipse>
                  </>
                )}
                {/* 灯泡灯丝 */}
                <path
                  d="M 22 18 Q 25 22 28 18"
                  stroke={gate.inputs[0]?.value === 1 ? "#f59e0b" : "#9ca3af"}
                  strokeWidth="1.5"
                  fill="none"
                  style={{ transition: 'all 0.3s ease' }}
                />
                {/* 灯泡底座 */}
                <rect x="20" y="33" width="10" height="6" fill="#94a3b8" />
                <rect x="21" y="39" width="8" height="3" fill="#6b7280" />
              </svg>
            </div>
          )}
        </div>

        {/* 标签编辑区 */}
        <div
          style={{
            width: '100px',
            textAlign: 'center',
            padding: '4px 8px',
            backgroundColor: '#f3f4f6',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: isEditingLabel ? 'text' : 'pointer',
          }}
          onDoubleClick={handleLabelDoubleClick}
          title={isEditingLabel ? '' : '双击编辑标签'}
        >
          {isEditingLabel ? (
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onBlur={handleLabelBlur}
              onKeyDown={handleLabelKeyDown}
              onMouseDown={(e) => e.stopPropagation()}
              autoFocus
              style={{
                width: '100%',
                padding: '2px 4px',
                border: '1px solid #3b82f6',
                borderRadius: '2px',
                fontSize: '12px',
                textAlign: 'center',
                outline: 'none',
              }}
            />
          ) : (
            <div style={{ color: gate.label ? '#374151' : '#9ca3af', fontWeight: gate.label ? '600' : 'normal' }}>
              {gate.label || gateDef.name}
            </div>
          )}
        </div>

        {/* INPUT门和CLOCK门：序列编辑按钮 */}
        {(gate.gateDefId === 'input' || gate.gateDefId === 'clock') && (
          <div style={{ width: '100px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingSequence(true);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                padding: '6px 8px',
                backgroundColor: gate.sequence ? '#3b82f6' : '#f3f4f6',
                color: gate.sequence ? 'white' : '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '500',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = gate.sequence ? '#2563eb' : '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = gate.sequence ? '#3b82f6' : '#f3f4f6';
              }}
              title="编辑信号序列"
            >
              {gate.sequence ? `序列 (${gate.sequence.length})` : '设置序列'}
            </button>

            {/* 序列可视化波形预览（边沿触发模式）*/}
            {gate.sequence && gate.sequence.length > 0 && (
              <div style={{
                marginTop: '4px',
                backgroundColor: '#f9fafb',
                padding: '6px 4px',
                borderRadius: '4px',
                border: '1px solid #e5e7eb',
              }}>
                {/* 显示步数信息 */}
                <div style={{
                  fontSize: '9px',
                  color: '#6b7280',
                  marginBottom: '4px',
                  textAlign: 'center',
                  fontWeight: '600',
                }}>
                  时钟步数: {circuit.clockStep || 0}
                </div>

                {/* 可滚动的波形容器 */}
                <div
                  ref={waveformContainerRef}
                  style={{
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    maxWidth: '100px',
                  }}
                >
                  {/* SVG 波形显示（边沿触发）*/}
                  <svg
                    width={(() => {
                      const bits = gate.sequence.split('');
                      const idleWidth = 12;
                      const minEdgeWidth = 15; // 每个边沿至少15个单位宽
                      const totalWidth = idleWidth + bits.length * minEdgeWidth;
                      return Math.max(100, totalWidth);
                    })()}
                    height="50"
                    viewBox={(() => {
                      const bits = gate.sequence.split('');
                      const idleWidth = 12;
                      const minEdgeWidth = 15;
                      const totalWidth = idleWidth + bits.length * minEdgeWidth;
                      return `0 0 ${Math.max(100, totalWidth)} 50`;
                    })()}
                    style={{
                      display: 'block',
                    }}
                  >
                  {/* 绘制边沿触发波形 */}
                  {(() => {
                    const bits = gate.sequence.split('');
                    const idleWidth = 12; // 空闲段宽度
                    const minEdgeWidth = 15; // 每个边沿至少15个单位宽
                    const edgeWidth = minEdgeWidth; // 每个边沿的宽度
                    const highY = 10; // 高电平Y坐标
                    const lowY = 25; // 低电平Y坐标
                    const currentStep = circuit.clockStep || 0;

                    // 根据第一个信号决定空闲电平
                    const idleLevel = bits[0] === '1' ? lowY : highY;

                    // 构建波形路径
                    const pathPoints: string[] = [];

                    // 1. 空闲段
                    pathPoints.push(`M 0 ${idleLevel}`);
                    pathPoints.push(`L ${idleWidth} ${idleLevel}`);

                    // 2. 每个边沿
                    let currentY = idleLevel;
                    bits.forEach((bit, index) => {
                      const edgeX = idleWidth + index * edgeWidth;
                      const targetY = bit === '1' ? highY : lowY;

                      // 垂直边沿（跳变）
                      pathPoints.push(`L ${edgeX} ${currentY}`);
                      pathPoints.push(`L ${edgeX} ${targetY}`);

                      // 水平保持
                      pathPoints.push(`L ${edgeX + edgeWidth} ${targetY}`);

                      currentY = targetY;
                    });

                    // 当前位置的X坐标
                    // clockStep=0: 还没执行任何边沿，虚线在空闲段中间
                    // clockStep=1: 已执行边沿0（sequence[0]），虚线在边沿0和边沿1之间
                    // clockStep=2: 已执行边沿1（sequence[1]），虚线在边沿1和边沿2之间
                    let currentX;
                    if (currentStep === 0) {
                      // 在空闲段中间
                      currentX = idleWidth / 2;
                    } else {
                      // 在当前边沿和下一个边沿的中间位置
                      currentX = idleWidth + (currentStep - 1) * edgeWidth + edgeWidth * 0.5;
                    }

                    return (
                      <>
                        {/* 波形线 */}
                        <path
                          d={pathPoints.join(' ')}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2"
                          strokeLinecap="square"
                          strokeLinejoin="miter"
                        />

                        {/* 当前位置虚线指示器 */}
                        <line
                          x1={currentX}
                          y1="5"
                          x2={currentX}
                          y2="30"
                          stroke={currentStep === 0 ? "#9ca3af" : "#ef4444"}
                          strokeWidth="1.5"
                          strokeDasharray="3,2"
                        />

                        {/* 当前位置三角形标记（顶部）*/}
                        <path
                          d={`M ${currentX} 5 L ${currentX - 2} 2 L ${currentX + 2} 2 Z`}
                          fill={currentStep === 0 ? "#9ca3af" : "#ef4444"}
                        />

                        {/* 当前位置三角形标记（底部）*/}
                        <path
                          d={`M ${currentX} 30 L ${currentX - 2} 33 L ${currentX + 2} 33 Z`}
                          fill={currentStep === 0 ? "#9ca3af" : "#ef4444"}
                        />

                        {/* 当前信号值（虚线下方）*/}
                        {(() => {
                          // 获取当前输出的信号值
                          const isIdleState = currentStep === 0;
                          let currentValue = '-';

                          if (isIdleState) {
                            // 空闲状态，显示待机标识
                            currentValue = '?';
                          } else if (currentStep >= 1 && currentStep <= bits.length) {
                            // 显示当前执行的序列值
                            currentValue = bits[currentStep - 1];
                          }

                          return (
                            <g>
                              {/* 背景圆圈 - 空闲状态使用灰色，执行状态使用白色 */}
                              <circle
                                cx={currentX}
                                cy="40"
                                r="7"
                                fill={isIdleState ? "#f3f4f6" : "white"}
                                stroke={isIdleState ? "#9ca3af" : "#ef4444"}
                                strokeWidth="2"
                                strokeDasharray={isIdleState ? "2,2" : "0"}
                              />
                              {/* 数字文本 */}
                              <text
                                x={currentX}
                                y="44.5"
                                fontSize="12"
                                fill={isIdleState ? "#9ca3af" : "#ef4444"}
                                textAnchor="middle"
                                fontWeight="bold"
                                fontFamily="monospace"
                              >
                                {currentValue}
                              </text>
                            </g>
                          );
                        })()}

                        {/* 电平标注 */}
                        <text x="1" y="12" fontSize="4" fill="#6b7280">H</text>
                        <text x="1" y="27" fontSize="4" fill="#6b7280">L</text>
                      </>
                    );
                  })()}
                </svg>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 序列编辑对话框 */}
        {isEditingSequence && (
          <SequenceEditorDialog
            currentSequence={gate.sequence || ''}
            gateLabel={gate.label || gateDef.name}
            onSave={(sequence) => {
              updateGateSequence(gate.id, sequence);
              setIsEditingSequence(false);
            }}
            onCancel={() => setIsEditingSequence(false)}
          />
        )}

        {/* 连接点 - 根据类型放在不同位置 */}
        {gate.gateDefId === 'clock' ? (
          // CLOCK门：只有右侧输出连接点
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (onPinClick) {
                onPinClick(gate.id, gate.outputs[0].id, true);
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              right: '-12px',
              top: '35px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: gate.outputs[0]?.value === 1 ? '#10b981' : '#6b7280',
              border: '3px solid white',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.3)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
            }}
          />
        ) : gate.gateDefId === 'input' ? (
          // INPUT门：左侧输入连接点 + 右侧输出连接点
          <>
            {/* 左侧输入连接点 */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (onPinClick) {
                  onPinClick(gate.id, gate.inputs[0].id, false);
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                left: '-12px',
                top: '35px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: gate.inputs[0]?.value === 1 ? '#10b981' : '#6b7280',
                border: '3px solid white',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.3)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
              }}
            />
            {/* 右侧输出连接点 */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (onPinClick) {
                  onPinClick(gate.id, gate.outputs[0].id, true);
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                right: '-12px',
                top: '35px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: gate.outputs[0]?.value === 1 ? '#10b981' : '#6b7280',
                border: '3px solid white',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.3)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
              }}
            />
          </>
        ) : (
          // OUTPUT门：只有左侧输入连接点
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (onPinClick) {
                onPinClick(gate.id, gate.inputs[0].id, false);
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              left: '-12px',
              top: '35px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: gate.inputs[0]?.value === 1 ? '#10b981' : '#6b7280',
              border: '3px solid white',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.3)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
            }}
          />
        )}
      </div>
    );
  }

  // 普通门的渲染（横向布局：输入在左，输出在右）
  return (
    <div
      style={{
        position: 'absolute',
        left: `${gate.position.x}px`,
        top: `${gate.position.y}px`,
        minWidth: '160px',
        backgroundColor: 'white',
        border: selected ? '2px solid #3b82f6' : '2px solid #d1d5db',
        borderRadius: '8px',
        padding: '12px 16px',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        boxShadow: selected ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={onContextMenu}
    >
      {/* 左侧：输入引脚 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
        {gate.inputs.map((pin, index) => (
          <div key={pin.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
            {/* 连接点 */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (onPinClick) {
                  onPinClick(gate.id, pin.id, false);
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                left: '-22px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: pin.value === 1 ? '#10b981' : '#6b7280',
                border: '2px solid white',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.3)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
              }}
            />
            <button
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                backgroundColor: pin.value === 1 ? '#10b981' : '#d1d5db',
                color: pin.value === 1 ? 'white' : 'black',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
              onClick={(e) => {
                e.stopPropagation();
                onInputChange(index, pin.value === 1 ? 0 : 1);
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {pin.value}
            </button>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>{pin.name}</span>
          </div>
        ))}
      </div>

      {/* 中间：门名称 */}
      <div style={{
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '16px',
        padding: '0 12px',
        minWidth: '60px',
      }}>
        {gateDef.name}
      </div>

      {/* 右侧：输出引脚 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
        {gate.outputs.map((pin) => (
          <div key={pin.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>{pin.name}</span>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                backgroundColor: pin.value === 1 ? '#10b981' : '#d1d5db',
                color: pin.value === 1 ? 'white' : 'black',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              {pin.value}
            </div>
            {/* 连接点 */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (onPinClick) {
                  onPinClick(gate.id, pin.id, true);
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                right: '-22px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: pin.value === 1 ? '#10b981' : '#6b7280',
                border: '2px solid white',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.3)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
