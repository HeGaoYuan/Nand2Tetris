// 基础逻辑门实现
import type { BitValue, GateDefinition } from '../types/circuit';

// 创建引脚辅助函数
const createPin = (name: string, value: BitValue = 0) => ({
  id: crypto.randomUUID(),
  name,
  value,
});

// NAND门 (与非门) - 最基础的门
export const NAND_GATE: GateDefinition = {
  id: 'nand',
  name: 'NAND',
  type: 'basic',
  inputs: [createPin('a'), createPin('b')],
  outputs: [createPin('out')],
  compute: (inputs: BitValue[]) => {
    const [a, b] = inputs;
    return [a === 1 && b === 1 ? 0 : 1];
  },
};

// 其他所有门都应该通过 NAND 门来实现
// 用户可以自己封装 NOT、AND、OR、XOR、MUX、DFF 等门

// 特殊门：用于自定义芯片的输入
export const INPUT_GATE: GateDefinition = {
  id: 'input',
  name: 'INPUT',
  type: 'io',
  inputs: [createPin('in')],  // INPUT 门可以接收来自其他门的信号
  outputs: [createPin('out')],
  compute: (inputs: BitValue[]) => {
    // 直接传递输入值到输出
    return [inputs[0]];
  },
};

// 特殊门：用于自定义芯片的输出
export const OUTPUT_GATE: GateDefinition = {
  id: 'output',
  name: 'OUTPUT',
  type: 'io',
  inputs: [createPin('in')],
  outputs: [createPin('out')],
  compute: (inputs: BitValue[]) => {
    return [inputs[0]]; // 直接传递输入值
  },
};

// 特殊门：时钟信号源（可配置序列的信号发生器）
export const CLOCK_GATE: GateDefinition = {
  id: 'clock',
  name: 'CLOCK',
  type: 'io',
  inputs: [],  // 无输入，只输出
  outputs: [createPin('out')],
  compute: () => {
    // 信号值由时钟步进系统控制，这里只是占位
    return [0];
  },
};

// 所有基础门的集合 - 只保留 NAND 门
export const BUILTIN_GATES: GateDefinition[] = [
  NAND_GATE,
];

// IO门（用于芯片封装）
export const IO_GATES: GateDefinition[] = [INPUT_GATE, OUTPUT_GATE, CLOCK_GATE];

// 所有门（包括基础门和IO门）
export const ALL_GATES: GateDefinition[] = [...BUILTIN_GATES, ...IO_GATES];

// 根据ID获取门定义
export const getGateById = (id: string): GateDefinition | undefined => {
  return ALL_GATES.find((gate) => gate.id === id);
};
