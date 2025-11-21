// 电路状态管理
import { create } from 'zustand';
import { Circuit, GateInstance, Wire, GateDefinition } from '../types/circuit';
import { BUILTIN_GATES } from '../engine/gates';
import { Simulator } from '../engine/simulator';

interface CircuitState {
  circuit: Circuit;
  simulator: Simulator | null;
  selectedGateId: string | null;

  // 操作方法
  addGate: (gateDefId: string, position: { x: number; y: number }) => void;
  removeGate: (gateId: string) => void;
  moveGate: (gateId: string, position: { x: number; y: number }) => void;
  addWire: (from: { gateId: string; pinId: string }, to: { gateId: string; pinId: string }) => void;
  removeWire: (wireId: string) => void;
  selectGate: (gateId: string | null) => void;
  setGateInput: (gateId: string, inputIndex: number, value: 0 | 1) => void;
  runSimulation: () => void;
  stepSimulation: () => void;
  resetSimulation: () => void;
  saveCustomGate: (name: string, gateIds: string[]) => void;
}

const initialCircuit: Circuit = {
  gates: [],
  wires: [],
  customGates: [],
};

export const useCircuitStore = create<CircuitState>((set, get) => ({
  circuit: initialCircuit,
  simulator: null,
  selectedGateId: null,

  addGate: (gateDefId: string, position: { x: number; y: number }) => {
    const gateDef = [...BUILTIN_GATES, ...get().circuit.customGates].find(
      (g) => g.id === gateDefId
    );
    if (!gateDef) return;

    const newGate: GateInstance = {
      id: crypto.randomUUID(),
      gateDefId,
      position,
      inputs: gateDef.inputs.map((pin) => ({ ...pin, id: crypto.randomUUID() })),
      outputs: gateDef.outputs.map((pin) => ({ ...pin, id: crypto.randomUUID() })),
    };

    set((state) => ({
      circuit: {
        ...state.circuit,
        gates: [...state.circuit.gates, newGate],
      },
    }));

    // 重新创建仿真器
    const newCircuit = get().circuit;
    set({ simulator: new Simulator(newCircuit) });
  },

  removeGate: (gateId: string) => {
    set((state) => ({
      circuit: {
        ...state.circuit,
        gates: state.circuit.gates.filter((g) => g.id !== gateId),
        wires: state.circuit.wires.filter(
          (w) => w.from.gateId !== gateId && w.to.gateId !== gateId
        ),
      },
    }));

    const newCircuit = get().circuit;
    set({ simulator: new Simulator(newCircuit) });
  },

  moveGate: (gateId: string, position: { x: number; y: number }) => {
    set((state) => ({
      circuit: {
        ...state.circuit,
        gates: state.circuit.gates.map((g) =>
          g.id === gateId ? { ...g, position } : g
        ),
      },
    }));
  },

  addWire: (
    from: { gateId: string; pinId: string },
    to: { gateId: string; pinId: string }
  ) => {
    const newWire: Wire = {
      id: crypto.randomUUID(),
      from,
      to,
    };

    set((state) => ({
      circuit: {
        ...state.circuit,
        wires: [...state.circuit.wires, newWire],
      },
    }));

    const newCircuit = get().circuit;
    set({ simulator: new Simulator(newCircuit) });
  },

  removeWire: (wireId: string) => {
    set((state) => ({
      circuit: {
        ...state.circuit,
        wires: state.circuit.wires.filter((w) => w.id !== wireId),
      },
    }));

    const newCircuit = get().circuit;
    set({ simulator: new Simulator(newCircuit) });
  },

  selectGate: (gateId: string | null) => {
    set({ selectedGateId: gateId });
  },

  setGateInput: (gateId: string, inputIndex: number, value: 0 | 1) => {
    set((state) => ({
      circuit: {
        ...state.circuit,
        gates: state.circuit.gates.map((g) => {
          if (g.id === gateId && g.inputs[inputIndex]) {
            const newInputs = [...g.inputs];
            newInputs[inputIndex] = { ...newInputs[inputIndex], value };
            return { ...g, inputs: newInputs };
          }
          return g;
        }),
      },
    }));

    // 触发仿真
    get().runSimulation();
  },

  runSimulation: () => {
    const { simulator } = get();
    if (!simulator) return;

    simulator.step();

    // 更新UI中的值
    set((state) => ({
      circuit: { ...state.circuit },
    }));
  },

  stepSimulation: () => {
    const { simulator } = get();
    if (!simulator) return;
    simulator.step();
    set((state) => ({ circuit: { ...state.circuit } }));
  },

  resetSimulation: () => {
    const { simulator } = get();
    if (!simulator) return;
    simulator.reset();
    set((state) => ({ circuit: { ...state.circuit } }));
  },

  saveCustomGate: (name: string, gateIds: string[]) => {
    // 简化版的自定义门保存
    // 实际应该将选中的gates和wires封装成一个新的GateDefinition
    console.log('保存自定义门:', name, gateIds);
    // TODO: 实现完整的自定义门封装逻辑
  },
}));
