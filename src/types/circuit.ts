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
}

export interface GateInstance {
  id: string;
  gateDefId: string;
  position: { x: number; y: number };
  inputs: Pin[];
  outputs: Pin[];
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
}
