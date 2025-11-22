// 芯片管理组件
import React from 'react';
import { useCircuitStore } from '../store/circuitStore';

export const ChipManagement: React.FC = () => {
  const {
    circuit,
    exportCustomGates,
    importCustomGates,
    clearCustomGates,
    deleteCustomGate,
  } = useCircuitStore();

  const [isOpen, setIsOpen] = React.useState(false);
  const [showChipList, setShowChipList] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 导出芯片库
  const handleExport = () => {
    const jsonData = exportCustomGates();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `my-chips-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  // 导入芯片库
  const handleImport = (mode: 'merge' | 'replace') => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('data-mode', mode);
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mode = e.target.getAttribute('data-mode') as 'merge' | 'replace';
    const reader = new FileReader();
    reader.onload = (event) => {
      const jsonData = event.target?.result as string;
      const success = importCustomGates(jsonData, mode);
      if (success) {
        alert(`导入成功！(${mode === 'merge' ? '合并模式' : '替换模式'})`);
      } else {
        alert('导入失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
    setIsOpen(false);
    // 重置文件输入
    e.target.value = '';
  };

  // 清空芯片库
  const handleClear = () => {
    if (window.confirm('确定要清空所有自定义芯片吗？此操作无法撤销！')) {
      clearCustomGates();
      setIsOpen(false);
    }
  };

  // 删除单个芯片
  const handleDelete = (gateId: string, gateName: string) => {
    if (window.confirm(`确定要删除芯片 "${gateName}" 吗？`)) {
      deleteCustomGate(gateId);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* 主按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '8px 16px',
          backgroundColor: '#8b5cf6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#7c3aed')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#8b5cf6')}
      >
        📦 芯片管理 ({circuit.customGates.length})
        <span style={{ fontSize: '10px' }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
          />

          {/* 菜单内容 */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '4px',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              minWidth: '220px',
              zIndex: 1000,
            }}
          >
            {/* 导出 */}
            <button
              onClick={handleExport}
              disabled={circuit.customGates.length === 0}
              style={{
                width: '100%',
                padding: '10px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: circuit.customGates.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                color: circuit.customGates.length === 0 ? '#9ca3af' : '#1f2937',
                borderBottom: '1px solid #e5e7eb',
              }}
              onMouseEnter={(e) => {
                if (circuit.customGates.length > 0) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              💾 导出芯片库
            </button>

            {/* 导入 - 合并模式 */}
            <button
              onClick={() => handleImport('merge')}
              style={{
                width: '100%',
                padding: '10px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#1f2937',
                borderBottom: '1px solid #e5e7eb',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              📥 导入芯片库 (合并)
            </button>

            {/* 导入 - 替换模式 */}
            <button
              onClick={() => handleImport('replace')}
              style={{
                width: '100%',
                padding: '10px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#1f2937',
                borderBottom: '1px solid #e5e7eb',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              📥 导入芯片库 (替换)
            </button>

            {/* 芯片列表 */}
            <button
              onClick={() => setShowChipList(!showChipList)}
              disabled={circuit.customGates.length === 0}
              style={{
                width: '100%',
                padding: '10px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: circuit.customGates.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                color: circuit.customGates.length === 0 ? '#9ca3af' : '#1f2937',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => {
                if (circuit.customGates.length > 0) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span>📊 芯片列表 ({circuit.customGates.length})</span>
              <span style={{ fontSize: '10px' }}>{showChipList ? '▲' : '▼'}</span>
            </button>

            {/* 芯片列表展开内容 */}
            {showChipList && circuit.customGates.length > 0 && (
              <div
                style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  backgroundColor: '#f9fafb',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                {circuit.customGates.map((gate) => (
                  <div
                    key={gate.id}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid #e5e7eb',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '500', color: '#1f2937' }}>{gate.name}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                        输入: {gate.inputs.length} | 输出: {gate.outputs.length}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(gate.id, gate.name)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fecaca')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 清空芯片库 */}
            <button
              onClick={handleClear}
              disabled={circuit.customGates.length === 0}
              style={{
                width: '100%',
                padding: '10px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: circuit.customGates.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                color: circuit.customGates.length === 0 ? '#9ca3af' : '#dc2626',
                fontWeight: '500',
              }}
              onMouseEnter={(e) => {
                if (circuit.customGates.length > 0) {
                  e.currentTarget.style.backgroundColor = '#fee2e2';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              🗑️ 清空芯片库
            </button>
          </div>
        </>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};
