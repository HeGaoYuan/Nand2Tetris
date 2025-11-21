// 芯片封装对话框
import React from 'react';
import { validateCircuit, type ValidationResult } from '../engine/validator';
import type { Circuit } from '../types/circuit';

interface ChipPackageDialogProps {
  circuit: Circuit;
  onPackage: (chipName: string) => void;
  onCancel: () => void;
}

export const ChipPackageDialog: React.FC<ChipPackageDialogProps> = ({
  circuit,
  onPackage,
  onCancel,
}) => {
  const [chipName, setChipName] = React.useState('');
  const [validation, setValidation] = React.useState<ValidationResult | null>(null);

  React.useEffect(() => {
    // 自动验证电路
    const result = validateCircuit(circuit);
    setValidation(result);
  }, [circuit]);

  const handlePackage = () => {
    if (!chipName.trim()) {
      alert('请输入芯片名称');
      return;
    }

    if (!validation?.valid) {
      alert('电路验证失败，请修复错误后再封装');
      return;
    }

    onPackage(chipName.trim());
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

            {/* 统计信息 */}
            <div style={{
              padding: '12px',
              backgroundColor: '#f3f4f6',
              borderRadius: '4px',
              marginBottom: '12px',
            }}>
              <div style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
                <strong>输入引脚 ({validation.inputGates.length}):</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px', paddingLeft: '16px' }}>
                {validation.inputGates.map((gate, i) => (
                  <div key={gate.id} style={{ marginBottom: '4px' }}>
                    • {gate.label || `in${i}`}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
                <strong>输出引脚 ({validation.outputGates.length}):</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', paddingLeft: '16px' }}>
                {validation.outputGates.map((gate, i) => (
                  <div key={gate.id} style={{ marginBottom: '4px' }}>
                    • {gate.label || `out${i}`}
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
