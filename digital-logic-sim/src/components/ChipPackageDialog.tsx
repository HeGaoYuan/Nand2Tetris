// 芯片封装对话框
import React from 'react';
import { validateCircuit, type ValidationResult } from '../engine/validator';
import type { Circuit, GateInstance } from '../types/circuit';

interface ChipPackageDialogProps {
  circuit: Circuit;
  onPackage: (chipName: string, inputPinOrder: GateInstance[], outputPinOrder: GateInstance[]) => void;
  onCancel: () => void;
}

export const ChipPackageDialog: React.FC<ChipPackageDialogProps> = ({
  circuit,
  onPackage,
  onCancel,
}) => {
  const [chipName, setChipName] = React.useState('');
  const [validation, setValidation] = React.useState<ValidationResult | null>(null);
  const [inputPins, setInputPins] = React.useState<typeof validation.inputGates>([]);
  const [outputPins, setOutputPins] = React.useState<typeof validation.outputGates>([]);
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    // 自动验证电路
    const result = validateCircuit(circuit);
    setValidation(result);
    // 初始化引脚顺序
    setInputPins(result.inputGates);
    setOutputPins(result.outputGates);
  }, [circuit]);

  // 拖拽处理函数
  const handleDragStart = (index: number, type: 'input' | 'output') => (e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('pinType', type);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (targetIndex: number, type: 'input' | 'output') => (e: React.DragEvent) => {
    e.preventDefault();
    const pinType = e.dataTransfer.getData('pinType');

    if (pinType !== type || draggedIndex === null) return;

    if (type === 'input') {
      const newPins = [...inputPins];
      const [removed] = newPins.splice(draggedIndex, 1);
      newPins.splice(targetIndex, 0, removed);
      setInputPins(newPins);
    } else {
      const newPins = [...outputPins];
      const [removed] = newPins.splice(draggedIndex, 1);
      newPins.splice(targetIndex, 0, removed);
      setOutputPins(newPins);
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handlePackage = () => {
    if (!chipName.trim()) {
      alert('请输入芯片名称');
      return;
    }

    if (!validation?.valid) {
      alert('电路验证失败，请修复错误后再封装');
      return;
    }

    onPackage(chipName.trim(), inputPins, outputPins);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
          封装自定义芯片
        </h2>

        {/* 芯片名称输入 */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
            芯片名称
          </label>
          <input
            type="text"
            value={chipName}
            onChange={(e) => setChipName(e.target.value)}
            placeholder="例如: HalfAdder"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px',
            }}
            autoFocus
          />
        </div>

        {/* 验证结果 */}
        {validation && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
              电路验证结果
            </h3>

            {/* 引脚排序 */}
            <div style={{
              padding: '12px',
              backgroundColor: '#f3f4f6',
              borderRadius: '4px',
              marginBottom: '12px',
            }}>
              <div style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
                <strong>输入引脚 ({inputPins.length}):</strong>
                <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
                  (拖拽调整顺序)
                </span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                {inputPins.map((gate, i) => (
                  <div
                    key={gate.id}
                    draggable
                    onDragStart={handleDragStart(i, 'input')}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop(i, 'input')}
                    onDragEnd={handleDragEnd}
                    style={{
                      padding: '8px 12px',
                      marginBottom: '4px',
                      backgroundColor: draggedIndex === i ? '#dbeafe' : 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'grab',
                      fontSize: '12px',
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ color: '#9ca3af' }}>☰</span>
                    <span style={{ fontWeight: '500' }}>{i}:</span>
                    {gate.label || `in${i}`}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
                <strong>输出引脚 ({outputPins.length}):</strong>
                <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
                  (拖拽调整顺序)
                </span>
              </div>
              <div>
                {outputPins.map((gate, i) => (
                  <div
                    key={gate.id}
                    draggable
                    onDragStart={handleDragStart(i, 'output')}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop(i, 'output')}
                    onDragEnd={handleDragEnd}
                    style={{
                      padding: '8px 12px',
                      marginBottom: '4px',
                      backgroundColor: draggedIndex === i ? '#dbeafe' : 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'grab',
                      fontSize: '12px',
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ color: '#9ca3af' }}>☰</span>
                    <span style={{ fontWeight: '500' }}>{i}:</span>
                    {gate.label || `out${i}`}
                  </div>
                ))}
              </div>
            </div>

            {/* 错误信息 */}
            {validation.errors.length > 0 && (
              <div style={{
                padding: '12px',
                backgroundColor: '#fee2e2',
                border: '1px solid #ef4444',
                borderRadius: '4px',
                marginBottom: '12px',
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#991b1b', marginBottom: '8px' }}>
                  ❌ 错误 ({validation.errors.length})
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {validation.errors.map((error, i) => (
                    <li key={i} style={{ fontSize: '14px', color: '#991b1b', marginBottom: '4px' }}>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 警告信息 */}
            {validation.warnings.length > 0 && (
              <div style={{
                padding: '12px',
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '4px',
                marginBottom: '12px',
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>
                  ⚠️ 警告 ({validation.warnings.length})
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {validation.warnings.map((warning, i) => (
                    <li key={i} style={{ fontSize: '14px', color: '#92400e', marginBottom: '4px' }}>
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 成功信息 */}
            {validation.valid && (
              <div style={{
                padding: '12px',
                backgroundColor: '#d1fae5',
                border: '1px solid #10b981',
                borderRadius: '4px',
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#065f46' }}>
                  ✅ 电路验证通过，可以封装！
                </div>
              </div>
            )}
          </div>
        )}

        {/* 按钮组 */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          >
            取消
          </button>
          <button
            onClick={handlePackage}
            disabled={!validation?.valid || !chipName.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: validation?.valid && chipName.trim() ? '#10b981' : '#d1d5db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: validation?.valid && chipName.trim() ? 'pointer' : 'not-allowed',
              fontSize: '14px',
            }}
            onMouseEnter={(e) => {
              if (validation?.valid && chipName.trim()) {
                e.currentTarget.style.backgroundColor = '#059669';
              }
            }}
            onMouseLeave={(e) => {
              if (validation?.valid && chipName.trim()) {
                e.currentTarget.style.backgroundColor = '#10b981';
              }
            }}
          >
            封装芯片
          </button>
        </div>
      </div>
    </div>
  );
};
