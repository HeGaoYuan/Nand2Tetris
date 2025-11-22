// 中间画布区域
import React from 'react';
import { useCircuitStore } from '../store/circuitStore';
import { GateComponent } from './GateComponent';
import { WireComponent } from './WireComponent';
import { ALL_GATES } from '../engine/gates';
import type { GateInstance, Pin } from '../types/circuit';

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
    removeWire,
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

  // 选中的连线ID
  const [selectedWireId, setSelectedWireId] = React.useState<string | null>(null);

  // 框选状态
  const [isSelecting, setIsSelecting] = React.useState(false);
  const [selectionStart, setSelectionStart] = React.useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = React.useState<{ x: number; y: number } | null>(null);
  const [selectedGateIds, setSelectedGateIds] = React.useState<string[]>([]);

  // 剪贴板：存储门和连线
  const [clipboard, setClipboard] = React.useState<{
    gates: typeof circuit.gates;
    wires: typeof circuit.wires;
  }>({ gates: [], wires: [] });

  // 用于跟踪是否刚完成框选
  const justFinishedSelecting = React.useRef(false);

  // 画布平移状态
  const [canvasOffset, setCanvasOffset] = React.useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = React.useState(false);
  const [panStart, setPanStart] = React.useState<{ x: number; y: number } | null>(null);
  const [isSpacePressed, setIsSpacePressed] = React.useState(false); // 空格键是否按下

  const handleCanvasClick = (e: React.MouseEvent) => {
    // 点击空白处取消选择
    // 注意：如果刚刚完成框选，不要立即清除选择
    const target = e.target as HTMLElement;
    const isCanvasOrContainer =
      e.target === e.currentTarget ||
      (target.style?.position === 'absolute' && target.style?.transform?.includes('translate'));

    if (isCanvasOrContainer && !isSelecting && !justFinishedSelecting.current) {
      selectGate(null);
      setContextMenu(null);
      setWireStart(null); // 取消连线
      setSelectedWireId(null); // 取消选中连线
      setSelectedGateIds([]); // 取消框选
    }

    // 重置标志
    justFinishedSelecting.current = false;
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

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // 检查是否点击在空白区域（不是门或其他组件）
    const target = e.target as HTMLElement;
    const isCanvasOrContainer =
      e.target === e.currentTarget ||
      (target.style?.position === 'absolute' && target.style?.transform?.includes('translate'));

    if (isCanvasOrContainer && !wireStart && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();

      // 按住空格键时进行画布平移
      if (isSpacePressed) {
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
      } else {
        // 否则进行框选
        setIsSelecting(true);
        setSelectionStart({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        setSelectionEnd(null);
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning && panStart) {
      // 画布平移
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setCanvasOffset({
        x: canvasOffset.x + dx,
        y: canvasOffset.y + dy,
      });
      setPanStart({ x: e.clientX, y: e.clientY });
    } else if (isSelecting && selectionStart && canvasRef.current) {
      // 框选
      const rect = canvasRef.current.getBoundingClientRect();
      setSelectionEnd({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleCanvasMouseUp = () => {
    if (isPanning) {
      // 结束画布平移
      setIsPanning(false);
      setPanStart(null);
    } else if (isSelecting && selectionStart && selectionEnd) {
      // 计算选择框范围（视口坐标）
      const viewMinX = Math.min(selectionStart.x, selectionEnd.x);
      const viewMaxX = Math.max(selectionStart.x, selectionEnd.x);
      const viewMinY = Math.min(selectionStart.y, selectionEnd.y);
      const viewMaxY = Math.max(selectionStart.y, selectionEnd.y);

      // 转换到内容坐标系（考虑画布平移）
      const minX = viewMinX - canvasOffset.x;
      const maxX = viewMaxX - canvasOffset.x;
      const minY = viewMinY - canvasOffset.y;
      const maxY = viewMaxY - canvasOffset.y;

      console.log('选择框调试信息:');
      console.log('  画布偏移:', canvasOffset);
      console.log('  视口选择框:', { viewMinX, viewMaxX, viewMinY, viewMaxY });
      console.log('  内容选择框:', { minX, maxX, minY, maxY });

      // 找出所有在选择框内的门
      const selected = circuit.gates.filter((gate) => {
        // 从DOM读取门的实际边界框（考虑transform等所有CSS效果）
        const gateElement = document.querySelector(`[data-gate-id="${gate.id}"]`)?.closest('[style*="position: absolute"]') as HTMLElement;

        if (!gateElement) {
          console.warn(`Cannot find DOM element for gate ${gate.id}`);
          return false;
        }

        const gateRect = gateElement.getBoundingClientRect();
        const canvasRect = canvasRef.current!.getBoundingClientRect();

        // 转换到canvas内容坐标系
        const gateLeft = gateRect.left - canvasRect.left - canvasOffset.x;
        const gateRight = gateRect.right - canvasRect.left - canvasOffset.x;
        const gateTop = gateRect.top - canvasRect.top - canvasOffset.y;
        const gateBottom = gateRect.bottom - canvasRect.top - canvasOffset.y;

        // 判断两个矩形是否相交
        // 相交条件：门的右边 > 选择框左边 AND 门的左边 < 选择框右边 AND 门的下边 > 选择框上边 AND 门的上边 < 选择框下边
        const isIntersecting = (
          gateRight > minX &&   // 门的右边在选择框左边的右侧
          gateLeft < maxX &&    // 门的左边在选择框右边的左侧
          gateBottom > minY &&  // 门的下边在选择框上边的下方
          gateTop < maxY        // 门的上边在选择框下边的上方
        );

        console.log(`${isIntersecting ? '✓ 选中' : '✗ 未选中'}: ${gate.gateDefId} at (${gate.position.x}, ${gate.position.y})`,
          `rotation: ${gate.rotation || 0}°`,
          `bounds: [${Math.round(gateLeft)}, ${Math.round(gateRight)}] x [${Math.round(gateTop)}, ${Math.round(gateBottom)}]`,
          `selection: [${minX}, ${maxX}] x [${minY}, ${maxY}]`
        );

        return isIntersecting;
      });

      setSelectedGateIds(selected.map((g) => g.id));

      // 标记刚完成框选，防止 click 事件清空选择
      justFinishedSelecting.current = true;
    }

    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 检查是否在输入框中
    const target = e.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    // Ctrl+C: 复制
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      e.preventDefault();
      if (selectedGateIds.length > 0) {
        // 复制所有选中的门
        const gatesToCopy = circuit.gates.filter((g) => selectedGateIds.includes(g.id));

        // 找出选中的门之间的连线
        const wiresToCopy = circuit.wires.filter((wire) =>
          selectedGateIds.includes(wire.from.gateId) &&
          selectedGateIds.includes(wire.to.gateId)
        );

        setClipboard({ gates: gatesToCopy, wires: wiresToCopy });
      }
    }

    // Ctrl+V: 粘贴
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault();
      if (clipboard.gates.length > 0) {
        // 创建旧ID到新ID的映射
        const idMap = new Map<string, string>();
        const newGateIds: string[] = [];

        // 先粘贴所有门，并记录ID映射
        clipboard.gates.forEach((gate) => {
          const newGateId = crypto.randomUUID();
          const newPosition = {
            x: gate.position.x + 50,  // 偏移50px
            y: gate.position.y + 50,
          };

          // 创建新门实例，保留所有属性
          const gateDef = [...ALL_GATES, ...circuit.customGates].find(
            (g) => g.id === gate.gateDefId
          );
          if (!gateDef) return;

          const newGate: GateInstance = {
            id: newGateId,
            gateDefId: gate.gateDefId,
            position: newPosition,
            inputs: gateDef.inputs.map((pin: Pin) => ({ ...pin, id: crypto.randomUUID() })),
            outputs: gateDef.outputs.map((pin: Pin) => ({ ...pin, id: crypto.randomUUID() })),
            label: gate.label, // 保留标签
            sequence: gate.sequence, // 保留序列
            rotation: gate.rotation, // 保留旋转角度
          };

          // 记录ID映射
          idMap.set(gate.id, newGateId);

          // 将门添加到电路中
          circuit.gates.push(newGate);
          newGateIds.push(newGateId);
        });

        // 然后粘贴连线，使用新的门ID
        clipboard.wires.forEach((wire) => {
          const newFromGateId = idMap.get(wire.from.gateId);
          const newToGateId = idMap.get(wire.to.gateId);

          if (!newFromGateId || !newToGateId) return;

          // 找到新门中对应的引脚ID
          const newFromGate = circuit.gates.find(g => g.id === newFromGateId);
          const newToGate = circuit.gates.find(g => g.id === newToGateId);

          if (!newFromGate || !newToGate) return;

          // 找到原始门中引脚的索引
          const oldFromGate = clipboard.gates.find(g => g.id === wire.from.gateId);
          const oldToGate = clipboard.gates.find(g => g.id === wire.to.gateId);

          if (!oldFromGate || !oldToGate) return;

          const outputPinIndex = oldFromGate.outputs.findIndex(p => p.id === wire.from.pinId);
          const inputPinIndex = oldToGate.inputs.findIndex(p => p.id === wire.to.pinId);

          if (outputPinIndex >= 0 && inputPinIndex >= 0) {
            // 使用新门中相同索引位置的引脚
            const newFromPinId = newFromGate.outputs[outputPinIndex]?.id;
            const newToPinId = newToGate.inputs[inputPinIndex]?.id;

            if (newFromPinId && newToPinId) {
              addWire(
                { gateId: newFromGateId, pinId: newFromPinId },
                { gateId: newToGateId, pinId: newToPinId }
              );
            }
          }
        });

        // 选中新粘贴的门
        setSelectedGateIds(newGateIds);
      }
    }

    // 方向键移动选中的门
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const moveDistance = 10; // 每次移动10px
      let dx = 0;
      let dy = 0;

      switch (e.key) {
        case 'ArrowUp':
          dy = -moveDistance;
          break;
        case 'ArrowDown':
          dy = moveDistance;
          break;
        case 'ArrowLeft':
          dx = -moveDistance;
          break;
        case 'ArrowRight':
          dx = moveDistance;
          break;
      }

      // 移动所有选中的门
      if (selectedGateIds.length > 0) {
        selectedGateIds.forEach((gateId) => {
          const gate = circuit.gates.find((g) => g.id === gateId);
          if (gate) {
            moveGate(gateId, {
              x: gate.position.x + dx,
              y: gate.position.y + dy,
            });
          }
        });
      } else if (selectedGateId) {
        // 如果只选中了一个门（通过点击选中）
        const gate = circuit.gates.find((g) => g.id === selectedGateId);
        if (gate) {
          moveGate(selectedGateId, {
            x: gate.position.x + dx,
            y: gate.position.y + dy,
          });
        }
      }
    }

    // Delete键删除选中的门或连线
    if (e.key === 'Delete' || e.key === 'Backspace') {
      // 如果在输入框中，不删除门
      if (isInputField) {
        return;
      }

      if (selectedGateId) {
        removeGate(selectedGateId);
        selectGate(null);
      } else if (selectedWireId) {
        removeWire(selectedWireId);
        setSelectedWireId(null);
      } else if (selectedGateIds.length > 0) {
        // 删除所有选中的门
        selectedGateIds.forEach((id) => removeGate(id));
        setSelectedGateIds([]);
      }
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

    // 获取画布的位置，考虑画布偏移
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - canvasOffset.x - 60; // 减去门宽度的一半
    const y = e.clientY - rect.top - canvasOffset.y - 60;  // 减去门高度的一半

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

  // 监听全局空格键按下/释放
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(false);
        // 如果正在拖动，释放空格键时停止拖动
        if (isPanning) {
          setIsPanning(false);
          setPanStart(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPanning]);

  // 自动保存画布状态（每5秒）
  React.useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      try {
        const serializableCircuit = {
          gates: circuit.gates,
          wires: circuit.wires,
          clockStep: circuit.clockStep,
        };
        localStorage.setItem('nand2tetris-circuit-state', JSON.stringify(serializableCircuit));
      } catch (error) {
        console.error('自动保存失败:', error);
      }
    }, 5000); // 每5秒保存一次

    return () => clearInterval(autoSaveInterval);
  }, [circuit]);

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
        transition: 'background-color 0.2s',
        cursor: isPanning ? 'grabbing' : (isSpacePressed ? 'grab' : 'default')
      }}
      onClick={handleCanvasClick}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      tabIndex={0}
    >
      {/* 可平移的内容容器 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
        }}
      >
        {/* SVG层用于渲染连线 */}
        <svg
          style={{
            position: 'absolute',
            left: '-5000px',
            top: '-5000px',
            width: '20000px', // 扩大画布空间，支持负坐标
            height: '20000px',
            pointerEvents: 'none', // 默认不接收事件，让鼠标事件穿透到画布
            zIndex: 0,
            overflow: 'visible'
          }}
        >
          {circuit.wires.map((wire) => (
            <WireComponent
              key={wire.id}
              wire={wire}
              gates={circuit.gates}
              selected={wire.id === selectedWireId}
              onSelect={() => {
                setSelectedWireId(wire.id);
                selectGate(null); // 取消选中门
              }}
            />
          ))}
        </svg>

        {/* 渲染所有门 */}
        {circuit.gates.map((gate) => {
        // 找出选中连线相关的引脚ID
        const selectedWire = selectedWireId ? circuit.wires.find(w => w.id === selectedWireId) : null;
        const highlightedPins = selectedWire ? {
          inputPinIds: selectedWire.to.gateId === gate.id ? [selectedWire.to.pinId] : [],
          outputPinIds: selectedWire.from.gateId === gate.id ? [selectedWire.from.pinId] : [],
        } : undefined;

        // 判断门是否被框选
        const isSelectedByBox = selectedGateIds.includes(gate.id);

        return (
          <GateComponent
            key={gate.id}
            gate={gate}
            selected={gate.id === selectedGateId || isSelectedByBox}
            selectedGateIds={selectedGateIds}
            onSelect={() => selectGate(gate.id)}
            onMove={(position: { x: number; y: number }, delta?: { dx: number; dy: number }) => {
              // 如果这个门是选中门列表中的一个，移动所有选中的门
              if (delta && selectedGateIds.includes(gate.id)) {
                selectedGateIds.forEach((gateId) => {
                  const g = circuit.gates.find((gateItem) => gateItem.id === gateId);
                  if (g) {
                    moveGate(gateId, {
                      x: g.position.x + delta.dx,
                      y: g.position.y + delta.dy,
                    });
                  }
                });
              } else {
                // 否则只移动这一个门
                moveGate(gate.id, position);
              }
            }}
            onInputChange={(inputIndex, value) =>
              setGateInput(gate.id, inputIndex, value)
            }
            onContextMenu={(e) => handleContextMenu(e, gate.id)}
            onPinClick={handlePinClick}
            highlightedPins={highlightedPins}
          />
        );
      })}
      </div>

      {/* 选择框 */}
      {isSelecting && selectionStart && selectionEnd && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(selectionStart.x, selectionEnd.x)}px`,
            top: `${Math.min(selectionStart.y, selectionEnd.y)}px`,
            width: `${Math.abs(selectionEnd.x - selectionStart.x)}px`,
            height: `${Math.abs(selectionEnd.y - selectionStart.y)}px`,
            border: '2px dashed #3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        />
      )}

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
