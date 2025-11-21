// 左侧组件面板
import React from 'react';
import { BUILTIN_GATES, IO_GATES } from '../engine/gates';
import type { GateDefinition } from '../types/circuit';

interface PaletteProps {
  onGateSelect: (gateId: string) => void;
  customGates?: GateDefinition[];
}

export const Palette: React.FC<PaletteProps> = ({ onGateSelect, customGates = [] }) => {
  const handleDragStart = (e: React.DragEvent, gateId: string) => {
    e.dataTransfer.setData('gateId', gateId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const renderGateItem = (gate: GateDefinition) => (
    <div
      key={gate.id}
      draggable
      onDragStart={(e) => handleDragStart(e, gate.id)}
      onClick={() => onGateSelect(gate.id)}
      style={{
        width: '100%',
        padding: '12px',
        backgroundColor: 'white',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        cursor: 'grab',
        textAlign: 'left',
        userSelect: 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#eff6ff';
        e.currentTarget.style.borderColor = '#60a5fa';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'white';
        e.currentTarget.style.borderColor = '#d1d5db';
      }}
      onDragEnd={(e) => {
        e.currentTarget.style.cursor = 'grab';
      }}
    >
      <div style={{ fontWeight: '600' }}>{gate.name}</div>
      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
        输入: {gate.inputs.map((p) => p.name).join(', ')}
      </div>
      <div style={{ fontSize: '12px', color: '#6b7280' }}>
        输出: {gate.outputs.map((p) => p.name).join(', ')}
      </div>
    </div>
  );

  return (
    <div style={{
      width: '256px',
      backgroundColor: '#f3f4f6',
      borderRight: '1px solid #d1d5db',
      padding: '16px',
      overflowY: 'auto'
    }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>逻辑门库</h2>

      {/* 基础逻辑门 */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>基础门</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {BUILTIN_GATES.map(renderGateItem)}
        </div>
      </div>

      {/* IO门（用于芯片封装） */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#8b5cf6', marginBottom: '8px' }}>接口门</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {IO_GATES.map(renderGateItem)}
        </div>
      </div>

      {/* 自定义芯片 */}
      {customGates.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#10b981', marginBottom: '8px' }}>自定义芯片</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {customGates.map(renderGateItem)}
          </div>
        </div>
      )}

      <div style={{
        marginTop: '24px',
        padding: '12px',
        backgroundColor: '#dbeafe',
        border: '1px solid #93c5fd',
        borderRadius: '4px'
      }}>
        <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>使用说明</h3>
        <ul style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
          <li>• 拖拽逻辑门到画布添加</li>
          <li>• 或点击逻辑门在中心添加</li>
          <li>• 拖动门可以移动位置</li>
          <li>• 点击输入按钮切换0/1</li>
          <li>• 点击输出引脚(右侧圆点)开始连线</li>
          <li>• 点击输入引脚(左侧圆点)完成连线</li>
          <li>• 右键点击门可删除</li>
          <li>• 使用INPUT/OUTPUT门定义芯片接口</li>
          <li>• 双击INPUT/OUTPUT门的标签可自定义名称</li>
        </ul>
      </div>
    </div>
  );
};
