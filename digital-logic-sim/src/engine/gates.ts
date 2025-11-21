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

// NOT门 (非门) - 由NAND实现
export const NOT_GATE: GateDefinition = {
  id: 'not',
  name: 'NOT',
  type: 'basic',
  inputs: [createPin('in')],
  outputs: [createPin('out')],
  compute: (inputs: BitValue[]) => {
    // NOT(x) = NAND(x, x)
    const x = inputs[0];
    return [x === 1 ? 0 : 1];
  },
};

// AND门 (与门) - 由NAND实现
export const AND_GATE: GateDefinition = {
  id: 'and',
  name: 'AND',
  type: 'basic',
  inputs: [createPin('a'), createPin('b')],
  outputs: [createPin('out')],
  compute: (inputs: BitValue[]) => {
    // AND(a, b) = NOT(NAND(a, b))
    const [a, b] = inputs;
    return [a === 1 && b === 1 ? 1 : 0];
  },
};

// OR门 (或门) - 由NAND实现
export const OR_GATE: GateDefinition = {
  id: 'or',
  name: 'OR',
  type: 'basic',
  inputs: [createPin('a'), createPin('b')],
  outputs: [createPin('out')],
  compute: (inputs: BitValue[]) => {
    // OR(a, b) = NAND(NOT(a), NOT(b))
    const [a, b] = inputs;
    return [a === 1 || b === 1 ? 1 : 0];
  },
};

// XOR门 (异或门)
export const XOR_GATE: GateDefinition = {
  id: 'xor',
  name: 'XOR',
  type: 'basic',
  inputs: [createPin('a'), createPin('b')],
  outputs: [createPin('out')],
  compute: (inputs: BitValue[]) => {
    const [a, b] = inputs;
    return [a !== b ? 1 : 0];
  },
};

// MUX门 (多路复用器)
export const MUX_GATE: GateDefinition = {
  id: 'mux',
  name: 'MUX',
  type: 'basic',
  inputs: [createPin('a'), createPin('b'), createPin('sel')],
  outputs: [createPin('out')],
  compute: (inputs: BitValue[]) => {
    const [a, b, sel] = inputs;
    return [sel === 0 ? a : b];
  },
};

// DFF (D触发器/继位器) - 时序逻辑的基础
export const DFF_GATE: GateDefinition = {
  id: 'dff',
  name: 'DFF',
  type: 'sequential',
  inputs: [createPin('d')],
  outputs: [createPin('q')],
  compute: (inputs: BitValue[]) => {
    // DFF的实际行为需要在仿真引擎中处理时序
    // 这里只是占位,真正的状态保存在仿真器中
    return [inputs[0]];
  },
};

// 特殊门：用于自定义芯片的输入
export const INPUT_GATE: GateDefinition = {
  id: 'input',
  name: 'INPUT',
  type: 'io',
  inputs: [createPin('in')],
  outputs: [createPin('out')],
  compute: (inputs: BitValue[]) => {
    return [inputs[0]]; // 直接传递输入值
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

// 所有基础门的集合
export const BUILTIN_GATES: GateDefinition[] = [
  NAND_GATE,
  NOT_GATE,
  AND_GATE,
  OR_GATE,
  XOR_GATE,
  MUX_GATE,
  DFF_GATE,
];

// IO门（用于芯片封装）
export const IO_GATES: GateDefinition[] = [INPUT_GATE, OUTPUT_GATE];

// 所有门（包括基础门和IO门）
export const ALL_GATES: GateDefinition[] = [...BUILTIN_GATES, ...IO_GATES];

// 根据ID获取门定义
export const getGateById = (id: string): GateDefinition | undefined => {
  return ALL_GATES.find((gate) => gate.id === id);
};
