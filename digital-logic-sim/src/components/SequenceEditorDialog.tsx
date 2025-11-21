// 信号序列编辑对话框
import React from 'react';

interface SequenceEditorDialogProps {
  currentSequence: string;
  gateLabel: string;
  onSave: (sequence: string) => void;
  onCancel: () => void;
}

export const SequenceEditorDialog: React.FC<SequenceEditorDialogProps> = ({
  currentSequence,
  gateLabel,
  onSave,
  onCancel,
}) => {
  const [sequence, setSequence] = React.useState(currentSequence);
  const [error, setError] = React.useState('');

  const handleSequenceChange = (value: string) => {
    // 只允许 0 和 1
    const cleaned = value.replace(/[^01]/g, '');
    setSequence(cleaned);
    setError('');
  };

  const handleSave = () => {
    if (sequence.length === 0) {
      setError('请至少输入一个信号值');
      return;
    }
    onSave(sequence);
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
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
          编辑信号序列: {gateLabel || 'INPUT'}
        </h2>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
            信号序列（只能输入 0 和 1）
          </label>
          <textarea
            value={sequence}
            onChange={(e) => handleSequenceChange(e.target.value)}
            placeholder="例如: 10011010001"
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              border: error ? '1px solid #ef4444' : '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '16px',
              fontFamily: 'monospace',
              letterSpacing: '2px',
              resize: 'vertical',
            }}
            autoFocus
          />
          {error && (
            <div style={{ marginTop: '4px', fontSize: '14px', color: '#ef4444' }}>
              {error}
            </div>
          )}
        </div>

        {/* 预览 */}
        {sequence.length > 0 && (
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#f3f4f6',
            borderRadius: '4px',
          }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
              预览（共 {sequence.length} 步）
            </div>
            <div style={{
              display: 'flex',
              gap: '2px',
              flexWrap: 'wrap',
              maxHeight: '120px',
              overflowY: 'auto',
            }}>
              {sequence.split('').map((bit, i) => (
                <div
                  key={i}
                  style={{
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: bit === '1' ? '#10b981' : '#6b7280',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                  }}
                >
                  {bit}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 快捷模板 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#6b7280' }}>
            快捷模板
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { name: '时钟信号', value: '0101010101' },
              { name: '脉冲信号', value: '0000100001' },
              { name: '测试序列', value: '10011010001' },
            ].map((template) => (
              <button
                key={template.name}
                onClick={() => handleSequenceChange(template.value)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>

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
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
