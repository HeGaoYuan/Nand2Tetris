// 中间画布区域
import React from 'react';
import { useCircuitStore } from '../store/circuitStore';
import { GateComponent } from './GateComponent';
import { WireComponent } from './WireComponent';

export const Canvas: React.FC = () => {
  const {
    circuit,
    selectedGateId,
    selectGate,
    moveGate,
    setGateInput,
    removeGate,
    addGate,
    addWire,
  } = useCircuitStore();

  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    gateId: string;
  } | null>(null);

  const [isDragOver, setIsDragOver] = React.useState(false);
  const canvasRef = React.useRef<HTMLDivElement>(null);

  // 连线状态：记录起始引脚
  const [wireStart, setWireStart] = React.useState<{
    gateId: string;
    pinId: string;
    isOutput: boolean;
  } | null>(null);

  const handleCanvasClick = (e: React.MouseEvent) => {
    // 点击空白处取消选择
    if (e.target === e.currentTarget) {
      selectGate(null);
      setContextMenu(null);
      setWireStart(null); // 取消连线
    }
  };

  const handlePinClick = (gateId: string, pinId: string, isOutput: boolean) => {
    if (!wireStart) {
      // 第一次点击：记录起始引脚（只能从输出开始）
      if (isOutput) {
        setWireStart({ gateId, pinId, isOutput });
      }
    } else {
      // 第二次点击：完成连线（只能连接到输入）
      if (!isOutput && wireStart.isOutput) {
        addWire(
          { gateId: wireStart.gateId, pinId: wireStart.pinId },
          { gateId, pinId }
        );
        setWireStart(null);
      } else {
        // 重置连线状态（如果点击了无效的引脚）
        setWireStart(null);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 删除选中的门
    if (e.key === 'Delete' && selectedGateId) {
      removeGate(selectedGateId);
      selectGate(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, gateId: string) => {
    e.preventDefault();
    e.stopPropagation();
    selectGate(gateId);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      gateId,
    });
  };

  const handleDeleteFromMenu = () => {
    if (contextMenu) {
      removeGate(contextMenu.gateId);
      selectGate(null);
      setContextMenu(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const gateId = e.dataTransfer.getData('gateId');
    if (!gateId || !canvasRef.current) return;

    // 获取画布的位置
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 60; // 减去门宽度的一半
    const y = e.clientY - rect.top - 60;  // 减去门高度的一半

    addGate(gateId, { x, y });
  };

  // 点击其他地方关闭菜单
  React.useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  return (
    <div
      ref={canvasRef}
      style={{
        flex: 1,
        backgroundColor: isDragOver ? '#e0f2fe' : '#f9fafb',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: `
          linear-gradient(to right, #e5e7eb 1px, transparent 1px),
          linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        transition: 'background-color 0.2s'
      }}
      onClick={handleCanvasClick}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      tabIndex={0}
    >
      {/* SVG层用于渲染连线 */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0
        }}
      >
        {circuit.wires.map((wire) => (
          <WireComponent key={wire.id} wire={wire} gates={circuit.gates} />
        ))}
      </svg>

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
          onContextMenu={(e) => handleContextMenu(e, gate.id)}
          onPinClick={handlePinClick}
        />
      ))}

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            minWidth: '120px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleDeleteFromMenu}
            style={{
              width: '100%',
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              color: '#ef4444',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            🗑️ 删除
          </button>
        </div>
      )}

      {/* 拖拽提示 */}
      {isDragOver && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          backgroundColor: 'rgba(59, 130, 246, 0.1)'
        }}>
          <div style={{
            fontSize: '24px',
            color: '#3b82f6',
            fontWeight: 'bold',
            backgroundColor: 'white',
            padding: '16px 32px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            松开鼠标添加逻辑门
          </div>
        </div>
      )}

      {/* 连线提示 */}
      {wireStart && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          fontSize: '14px',
          fontWeight: '500'
        }}>
          点击目标门的输入引脚完成连线，或点击空白处取消
        </div>
      )}

      {/* 提示信息 */}
      {circuit.gates.length === 0 && !isDragOver && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{ color: '#9ca3af', textAlign: 'center' }}>
            <p style={{ fontSize: '24px', marginBottom: '8px' }}>
              拖拽左侧逻辑门到这里
            </p>
            <p style={{ fontSize: '18px' }}>或点击逻辑门在中心添加</p>
          </div>
        </div>
      )}
    </div>
  );
};
