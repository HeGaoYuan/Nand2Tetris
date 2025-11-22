// 基础类型定义

export type BitValue = 0 | 1;

export interface Pin {
  id: string;
  name: string;
  value: BitValue;
}

export interface GateDefinition {
  id: string;
  name: string;
  type: string;
  inputs: Pin[];
  outputs: Pin[];
  compute: (inputs: BitValue[]) => BitValue[];
  // 自定义芯片的内部电路结构（可序列化）
  internalCircuit?: {
    gates: GateInstance[];
    wires: Wire[];
    inputGateIds: string[];  // INPUT 门的ID列表（按顺序）
    outputGateIds: string[]; // OUTPUT 门的ID列表（按顺序）
  };
}

export interface GateInstance {
  id: string;
  gateDefId: string;
  position: { x: number; y: number };
  inputs: Pin[];
  outputs: Pin[];
  label?: string; // 自定义标签，用于 INPUT/OUTPUT 门的命名
  sequence?: string; // INPUT 门的信号序列，如 "10011010"
  rotation?: number; // 旋转角度：0, 90, 180, 270（度）
}

export interface Wire {
  id: string;
  from: { gateId: string; pinId: string };
  to: { gateId: string; pinId: string };
}

export interface Circuit {
  gates: GateInstance[];
  wires: Wire[];
  customGates: GateDefinition[];
  clockStep?: number; // 当前时钟步数，用于序列播放
}
