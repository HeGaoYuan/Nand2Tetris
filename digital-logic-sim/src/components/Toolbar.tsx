// 顶部工具栏
import React from 'react';
import { useCircuitStore } from '../store/circuitStore';
import { ChipPackageDialog } from './ChipPackageDialog';

export const Toolbar: React.FC = () => {
  const {
    circuit,
    saveCustomGate,
    clockStep,
    startPlaying,
    stopPlaying,
    resetClock,
    isPlaying,
    playSpeed,
    setPlaySpeed
  } = useCircuitStore();
  const [showPackageDialog, setShowPackageDialog] = React.useState(false);

  const handlePackage = (chipName: string) => {
    saveCustomGate(chipName);
    setShowPackageDialog(false);
  };

  return (
    <>
      <div style={{
        height: '64px',
        backgroundColor: 'white',
        borderBottom: '1px solid #d1d5db',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '16px'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
          数字逻辑仿真器
        </h1>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowPackageDialog(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
          >
            📦 封装芯片
          </button>

          {/* 时钟控制区 */}
          <div style={{
            display: 'flex',
            gap: '8px',
            padding: '0 8px',
            borderLeft: '2px solid #e5e7eb',
            borderRight: '2px solid #e5e7eb',
            alignItems: 'center',
          }}>
            <button
              onClick={clockStep}
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
              title="时钟步进一次"
            >
              ⏭ 执行一步
            </button>

            <button
              onClick={isPlaying ? stopPlaying : startPlaying}
              style={{
                padding: '8px 16px',
                backgroundColor: isPlaying ? '#ef4444' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                minWidth: '100px',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isPlaying ? '#dc2626' : '#059669'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isPlaying ? '#ef4444' : '#10b981'}
              title={isPlaying ? '停止自动播放' : '开始自动播放'}
            >
              {isPlaying ? '⏸ 停止播放' : '▶ 开始播放'}
            </button>

            <button
              onClick={resetClock}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
              title="重置时钟到第0步"
            >
              🔄 重置时钟
            </button>

            {/* 速度控制 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginLeft: '8px',
              paddingLeft: '8px',
              borderLeft: '1px solid #d1d5db',
            }}>
              <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>速度:</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[
                  { label: '0.5x', value: 2000 },
                  { label: '1x', value: 1000 },
                  { label: '2x', value: 500 },
                  { label: '4x', value: 250 },
                ].map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => setPlaySpeed(value)}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: playSpeed === value ? '#3b82f6' : '#f3f4f6',
                      color: playSpeed === value ? 'white' : '#6b7280',
                      border: playSpeed === value ? 'none' : '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: playSpeed === value ? '600' : '500',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (playSpeed !== value) {
                        e.currentTarget.style.backgroundColor = '#e5e7eb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (playSpeed !== value) {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }
                    }}
                    title={`${label} 速度 (${value}ms/步)`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          门数量: {circuit.gates.length} | 连线: {circuit.wires.length} | 时钟步数: {circuit.clockStep || 0}
        </div>
      </div>

      {/* 芯片封装对话框 */}
      {showPackageDialog && (
        <ChipPackageDialog
          circuit={circuit}
          onPackage={handlePackage}
          onCancel={() => setShowPackageDialog(false)}
        />
      )}
    </>
  );
};
