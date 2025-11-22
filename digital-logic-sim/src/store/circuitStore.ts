// 电路状态管理
import { create } from 'zustand';
import type { Circuit, GateInstance, Wire, BitValue, GateDefinition } from '../types/circuit';
import { ALL_GATES } from '../engine/gates';
import { Simulator } from '../engine/simulator';

interface CircuitState {
  circuit: Circuit;
  simulator: Simulator | null;
  selectedGateId: string | null;
  isPlaying: boolean; // 是否正在自动播放
  playIntervalId: number | null; // 播放定时器ID
  playSpeed: number; // 播放速度（毫秒），默认1000ms

  // 操作方法
  addGate: (gateDefId: string, position: { x: number; y: number }) => void;
  removeGate: (gateId: string) => void;
  moveGate: (gateId: string, position: { x: number; y: number }) => void;
  addWire: (from: { gateId: string; pinId: string }, to: { gateId: string; pinId: string }) => void;
  removeWire: (wireId: string) => void;
  selectGate: (gateId: string | null) => void;
  setGateInput: (gateId: string, inputIndex: number, value: 0 | 1) => void;
  updateGateLabel: (gateId: string, label: string) => void;
  updateGateSequence: (gateId: string, sequence: string) => void;
  runSimulation: () => void;
  stepSimulation: () => void;
  resetSimulation: () => void;
  clockStep: () => void; // 时钟步进
  startPlaying: () => void; // 开始自动播放
  stopPlaying: () => void; // 停止自动播放
  resetClock: () => void; // 重置时钟
  setPlaySpeed: (speed: number) => void; // 设置播放速度
  saveCustomGate: (name: string) => void;
  clearCircuit: () => void; // 清空画布
}

const initialCircuit: Circuit = {
  gates: [],
  wires: [],
  customGates: [],
  clockStep: 0,
};

export const useCircuitStore = create<CircuitState>((set, get) => ({
  circuit: initialCircuit,
  simulator: null,
  selectedGateId: null,
  isPlaying: false,
  playIntervalId: null,
  playSpeed: 1000, // 默认1000ms

  addGate: (gateDefId: string, position: { x: number; y: number }) => {
    const gateDef = [...ALL_GATES, ...get().circuit.customGates].find(
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
    // 更新输入值
    set((state) => {
      const gates = state.circuit.gates.map((g) => {
        if (g.id === gateId) {
          // 如果是 INPUT 门，同时更新输入和输出（用于手动切换）
          if (g.gateDefId === 'input' && g.inputs[inputIndex]) {
            const newInputs = [...g.inputs];
            newInputs[inputIndex] = { ...newInputs[inputIndex], value };
            const newOutputs = g.outputs.map(pin => ({ ...pin, value }));
            return { ...g, inputs: newInputs, outputs: newOutputs };
          }

          // 其他门：更新输入引脚
          if (g.inputs[inputIndex]) {
            const newInputs = [...g.inputs];
            newInputs[inputIndex] = { ...newInputs[inputIndex], value };
            return { ...g, inputs: newInputs };
          }
        }
        return g;
      });

      return {
        circuit: {
          ...state.circuit,
          gates,
        },
      };
    });

    // 触发信号传播
    get().runSimulation();
  },

  updateGateLabel: (gateId: string, label: string) => {
    set((state) => ({
      circuit: {
        ...state.circuit,
        gates: state.circuit.gates.map((g) =>
          g.id === gateId ? { ...g, label } : g
        ),
      },
    }));
  },

  updateGateSequence: (gateId: string, sequence: string) => {
    set((state) => ({
      circuit: {
        ...state.circuit,
        gates: state.circuit.gates.map((g) =>
          g.id === gateId ? { ...g, sequence } : g
        ),
      },
    }));
    // 重置时钟以重新开始
    get().resetClock();
  },

  runSimulation: () => {
    const { circuit } = get();
    let gates = [...circuit.gates];

    // 多次迭代以传播信号(最多10次,防止无限循环)
    for (let iteration = 0; iteration < 10; iteration++) {
      let changed = false;

      // 1. 沿着连线传播信号
      circuit.wires.forEach((wire) => {
        const fromGate = gates.find((g) => g.id === wire.from.gateId);
        const toGate = gates.find((g) => g.id === wire.to.gateId);

        if (!fromGate || !toGate) return;

        const outputPin = fromGate.outputs.find((p) => p.id === wire.from.pinId);
        const inputPinIndex = toGate.inputs.findIndex((p) => p.id === wire.to.pinId);

        if (outputPin && inputPinIndex >= 0) {
          const currentValue = toGate.inputs[inputPinIndex].value;
          if (currentValue !== outputPin.value) {
            gates = gates.map((g) => {
              if (g.id === toGate.id) {
                const newInputs = [...g.inputs];
                newInputs[inputPinIndex] = { ...newInputs[inputPinIndex], value: outputPin.value };
                return { ...g, inputs: newInputs };
              }
              return g;
            });
            changed = true;
          }
        }
      });

      // 2. 计算所有门的输出
      gates = gates.map((gate) => {
        const gateDef = [...ALL_GATES, ...circuit.customGates].find(
          (def) => def.id === gate.gateDefId
        );

        if (!gateDef || gateDef.type === 'sequential') return gate;

        // CLOCK 和 INPUT 门作为信号源，输出值由 clockStep 直接设置，不需要重新计算
        // 它们的输出值已经在 clockStep 中正确设置了
        if (gate.gateDefId === 'clock' || gate.gateDefId === 'input') {
          return gate;
        }

        const inputValues = gate.inputs.map(pin => pin.value);
        const outputValues = gateDef.compute(inputValues);
        const newOutputs = gate.outputs.map((pin, idx) => ({
          ...pin,
          value: (outputValues[idx] || 0) as BitValue
        }));

        // 检查输出是否改变
        const outputChanged = newOutputs.some((pin, idx) => pin.value !== gate.outputs[idx].value);
        if (outputChanged) changed = true;

        return { ...gate, outputs: newOutputs };
      });

      // 如果没有变化,停止迭代
      if (!changed) break;
    }

    set((state) => ({
      circuit: {
        ...state.circuit,
        gates,
      },
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

  saveCustomGate: (name: string) => {
    const { circuit } = get();

    // 找出所有 INPUT 和 OUTPUT 门
    const inputGates = circuit.gates.filter(g => g.gateDefId === 'input');
    const outputGates = circuit.gates.filter(g => g.gateDefId === 'output');

    if (inputGates.length === 0 || outputGates.length === 0) {
      console.error('需要至少一个INPUT和OUTPUT门');
      return;
    }

    // 创建新的门定义，使用自定义标签作为引脚名称
    const newGateDef: GateDefinition = {
      id: `custom-${crypto.randomUUID()}`,
      name,
      type: 'custom',
      inputs: inputGates.map((gate, i) => ({
        id: crypto.randomUUID(),
        name: gate.label || `in${i}`,
        value: 0 as BitValue,
      })),
      outputs: outputGates.map((gate, i) => ({
        id: crypto.randomUUID(),
        name: gate.label || `out${i}`,
        value: 0 as BitValue,
      })),
      compute: (inputs: BitValue[]): BitValue[] => {
        // 创建一个内部电路副本来模拟
        const internalGates = circuit.gates.map(g => {
          if (g.gateDefId === 'input') {
            // 将输入值传递给INPUT门
            const inputIndex = inputGates.findIndex(ig => ig.id === g.id);
            return {
              ...g,
              inputs: g.inputs.map(pin => ({ ...pin, value: inputs[inputIndex] || 0 })),
              outputs: g.outputs.map(pin => ({ ...pin, value: inputs[inputIndex] || 0 })),
            };
          }
          return { ...g };
        });

        // 运行模拟（简化版 - 最多10次迭代）
        for (let iteration = 0; iteration < 10; iteration++) {
          let changed = false;

          // 沿着连线传播信号
          circuit.wires.forEach(wire => {
            const fromGate = internalGates.find(g => g.id === wire.from.gateId);
            const toGate = internalGates.find(g => g.id === wire.to.gateId);

            if (!fromGate || !toGate) return;

            const outputPin = fromGate.outputs.find(p => p.id === wire.from.pinId);
            const inputPinIndex = toGate.inputs.findIndex(p => p.id === wire.to.pinId);

            if (outputPin && inputPinIndex >= 0) {
              const currentValue = toGate.inputs[inputPinIndex].value;
              if (currentValue !== outputPin.value) {
                toGate.inputs[inputPinIndex] = { ...toGate.inputs[inputPinIndex], value: outputPin.value };
                changed = true;
              }
            }
          });

          // 计算所有门的输出
          internalGates.forEach(gate => {
            if (gate.gateDefId === 'input' || gate.gateDefId === 'output') return;

            const gateDef = [...ALL_GATES, ...circuit.customGates].find(
              def => def.id === gate.gateDefId
            );

            if (!gateDef || gateDef.type === 'sequential') return;

            const inputValues = gate.inputs.map(pin => pin.value) as BitValue[];
            const outputValues = gateDef.compute(inputValues);

            outputValues.forEach((val, idx) => {
              if (gate.outputs[idx] && gate.outputs[idx].value !== val) {
                gate.outputs[idx] = { ...gate.outputs[idx], value: val as BitValue };
                changed = true;
              }
            });
          });

          if (!changed) break;
        }

        // 提取OUTPUT门的值作为结果
        return outputGates.map(og => {
          const gate = internalGates.find(g => g.id === og.id);
          return (gate?.inputs[0]?.value || 0) as BitValue;
        });
      },
    };

    // 添加到自定义门列表
    set(state => ({
      circuit: {
        ...state.circuit,
        customGates: [...state.circuit.customGates, newGateDef],
      },
    }));

    console.log('自定义芯片已封装:', name);
  },

  clockStep: () => {
    const { circuit } = get();
    const currentStep = circuit.clockStep || 0;

    // 检查是否已达到序列长度限制（检查 INPUT 门和 CLOCK 门）
    const sequenceGates = circuit.gates.filter(g =>
      (g.gateDefId === 'input' || g.gateDefId === 'clock') && g.sequence
    );
    const maxLength = Math.max(...sequenceGates.map(g => g.sequence?.length || 0), 0);

    if (maxLength > 0 && currentStep >= maxLength) {
      // 已经执行完所有序列，不再继续
      return;
    }

    // 先递增 clockStep，然后根据新的步数更新 INPUT 门和 CLOCK 门
    const newStep = currentStep + 1;

    // 更新所有有序列的 INPUT 门和 CLOCK 门的值
    const updatedGates = circuit.gates.map((gate) => {
      if ((gate.gateDefId === 'input' || gate.gateDefId === 'clock') &&
          gate.sequence && gate.sequence.length > 0) {
        // newStep=1 对应 sequence[0]，newStep=2 对应 sequence[1]，以此类推
        const bitIndex = (newStep - 1) % gate.sequence.length;
        const bitValue = gate.sequence[bitIndex] === '1' ? 1 : 0;

        if (gate.gateDefId === 'clock') {
          // CLOCK 门只有输出
          return {
            ...gate,
            outputs: gate.outputs.map(pin => ({ ...pin, value: bitValue as BitValue })),
          };
        } else {
          // INPUT 门有输入和输出，都需要更新
          return {
            ...gate,
            inputs: gate.inputs.map(pin => ({ ...pin, value: bitValue as BitValue })),
            outputs: gate.outputs.map(pin => ({ ...pin, value: bitValue as BitValue })),
          };
        }
      }
      return gate;
    });

    set({
      circuit: {
        ...circuit,
        gates: updatedGates,
        clockStep: newStep,
      },
    });

    // 触发仿真
    get().runSimulation();
  },

  startPlaying: () => {
    const { isPlaying, playSpeed } = get();
    if (isPlaying) return;

    set({ isPlaying: true });

    const intervalId = window.setInterval(() => {
      const { circuit } = get();
      const currentStep = circuit.clockStep || 0;

      // 检查是否所有序列门（INPUT 和 CLOCK）都已完成序列
      const sequenceGates = circuit.gates.filter(g =>
        (g.gateDefId === 'input' || g.gateDefId === 'clock') && g.sequence
      );
      const maxLength = Math.max(...sequenceGates.map(g => g.sequence?.length || 0), 0);

      // 如果当前步数已达到序列长度，停止播放
      // clockStep=0: 初始状态
      // clockStep=maxLength: 执行完最后一个边沿
      if (maxLength > 0 && currentStep >= maxLength) {
        // 所有序列已完成，自动停止
        get().stopPlaying();
        return;
      }

      get().clockStep();
    }, playSpeed);

    set({ playIntervalId: intervalId });
  },

  stopPlaying: () => {
    const { playIntervalId } = get();
    if (playIntervalId !== null) {
      clearInterval(playIntervalId);
    }
    set({ isPlaying: false, playIntervalId: null });
  },

  resetClock: () => {
    get().stopPlaying();

    const { circuit } = get();

    // 重置时钟步数，所有有序列的 INPUT 门和 CLOCK 门回到空闲状态（根据首位信号的反向）
    const updatedGates = circuit.gates.map((gate) => {
      if ((gate.gateDefId === 'input' || gate.gateDefId === 'clock') &&
          gate.sequence && gate.sequence.length > 0) {
        // 空闲状态是首位信号的反向
        // 如果 sequence[0] = '1'（需要上升沿），则空闲为 0
        // 如果 sequence[0] = '0'（需要下降沿），则空闲为 1
        const idleValue = gate.sequence[0] === '1' ? 0 : 1;

        if (gate.gateDefId === 'clock') {
          // CLOCK 门只有输出
          return {
            ...gate,
            outputs: gate.outputs.map(pin => ({ ...pin, value: idleValue as BitValue })),
          };
        } else {
          // INPUT 门有输入和输出，都需要更新
          return {
            ...gate,
            inputs: gate.inputs.map(pin => ({ ...pin, value: idleValue as BitValue })),
            outputs: gate.outputs.map(pin => ({ ...pin, value: idleValue as BitValue })),
          };
        }
      }
      return gate;
    });

    set({
      circuit: {
        ...circuit,
        gates: updatedGates,
        clockStep: 0,
      },
    });

    // 触发仿真
    get().runSimulation();
  },

  setPlaySpeed: (speed: number) => {
    const { isPlaying } = get();
    set({ playSpeed: speed });

    // 如果正在播放，重启定时器以应用新速度
    if (isPlaying) {
      get().stopPlaying();
      get().startPlaying();
    }
  },

  clearCircuit: () => {
    // 停止播放
    get().stopPlaying();

    // 清空所有门和连线，重置时钟，保留自定义门定义
    set((state) => ({
      circuit: {
        ...initialCircuit,
        customGates: state.circuit.customGates, // 保留自定义门
      },
      simulator: null,
      selectedGateId: null,
    }));
  },
}));
