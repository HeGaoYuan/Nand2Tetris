// 仿真引擎核心
import type { BitValue, Circuit, GateInstance, Wire, GateDefinition } from '../types/circuit';
import { BUILTIN_GATES } from './gates';

export class Simulator {
  private circuit: Circuit;
  private gateDefinitions: Map<string, GateDefinition>;
  private dffStates: Map<string, BitValue[]>; // DFF的状态存储

  constructor(circuit: Circuit) {
    this.circuit = circuit;
    this.gateDefinitions = new Map();
    this.dffStates = new Map();

    // 加载内置门
    BUILTIN_GATES.forEach((gate) => {
      this.gateDefinitions.set(gate.id, gate);
    });

    // 加载自定义门
    circuit.customGates.forEach((gate) => {
      this.gateDefinitions.set(gate.id, gate);
    });
  }

  // 设置门的输入值
  setGateInputs(gateId: string, inputValues: BitValue[]): void {
    const gate = this.circuit.gates.find((g) => g.id === gateId);
    if (!gate) return;

    inputValues.forEach((value, index) => {
      if (gate.inputs[index]) {
        gate.inputs[index].value = value;
      }
    });
  }

  // 获取门的输出值
  getGateOutputs(gateId: string): BitValue[] {
    const gate = this.circuit.gates.find((g) => g.id === gateId);
    if (!gate) return [];
    return gate.outputs.map((pin) => pin.value);
  }

  // 计算单个门的输出
  private computeGate(gate: GateInstance): void {
    const gateDef = this.gateDefinitions.get(gate.gateDefId);
    if (!gateDef) return;

    const inputValues = gate.inputs.map((pin) => pin.value);

    // 对于DFF,需要特殊处理
    if (gateDef.type === 'sequential') {
      const prevState = this.dffStates.get(gate.id) || [0];
      gate.outputs.forEach((pin, index) => {
        pin.value = prevState[index] || 0;
      });
    } else {
      // 组合逻辑门
      const outputValues = gateDef.compute(inputValues);
      gate.outputs.forEach((pin, index) => {
        pin.value = outputValues[index] || 0;
      });
    }
  }

  // 传播信号
  private propagateSignals(): void {
    const wireMap = new Map<string, Wire[]>();

    // 建立从输出引脚到导线的映射
    this.circuit.wires.forEach((wire) => {
      const key = `${wire.from.gateId}:${wire.from.pinId}`;
      if (!wireMap.has(key)) {
        wireMap.set(key, []);
      }
      wireMap.get(key)!.push(wire);
    });

    // 沿着导线传播信号
    this.circuit.wires.forEach((wire) => {
      const fromGate = this.circuit.gates.find((g) => g.id === wire.from.gateId);
      const toGate = this.circuit.gates.find((g) => g.id === wire.to.gateId);

      if (!fromGate || !toGate) return;

      const outputPin = fromGate.outputs.find((p) => p.id === wire.from.pinId);
      const inputPin = toGate.inputs.find((p) => p.id === wire.to.pinId);

      if (outputPin && inputPin) {
        inputPin.value = outputPin.value;
      }
    });
  }

  // 拓扑排序 - 确定计算顺序
  private topologicalSort(): GateInstance[] {
    const sorted: GateInstance[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();

    const visit = (gate: GateInstance): void => {
      if (temp.has(gate.id)) {
        console.warn('检测到循环依赖!');
        return;
      }
      if (visited.has(gate.id)) return;

      temp.add(gate.id);

      // 找到所有输入来自哪些门
      const inputWires = this.circuit.wires.filter((w) => w.to.gateId === gate.id);
      inputWires.forEach((wire) => {
        const sourceGate = this.circuit.gates.find((g) => g.id === wire.from.gateId);
        if (sourceGate) {
          visit(sourceGate);
        }
      });

      temp.delete(gate.id);
      visited.add(gate.id);
      sorted.push(gate);
    };

    this.circuit.gates.forEach((gate) => {
      if (!visited.has(gate.id)) {
        visit(gate);
      }
    });

    return sorted;
  }

  // 执行一个时钟周期的仿真
  step(): void {
    // 1. 计算所有组合逻辑门 (按拓扑顺序)
    const sortedGates = this.topologicalSort();
    sortedGates.forEach((gate) => {
      this.computeGate(gate);
      this.propagateSignals();
    });

    // 2. 更新DFF状态 (在时钟上升沿)
    this.circuit.gates.forEach((gate) => {
      const gateDef = this.gateDefinitions.get(gate.gateDefId);
      if (gateDef?.type === 'sequential') {
        const inputValues = gate.inputs.map((pin) => pin.value);
        this.dffStates.set(gate.id, inputValues);
      }
    });
  }

  // 运行多个时钟周期
  run(cycles: number): void {
    for (let i = 0; i < cycles; i++) {
      this.step();
    }
  }

  // 重置仿真
  reset(): void {
    this.dffStates.clear();
    this.circuit.gates.forEach((gate) => {
      gate.inputs.forEach((pin) => (pin.value = 0));
      gate.outputs.forEach((pin) => (pin.value = 0));
    });
  }
}
