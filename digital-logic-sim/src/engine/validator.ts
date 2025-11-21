// 电路验证工具
import type { Circuit, GateInstance } from '../types/circuit';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  inputGates: GateInstance[];
  outputGates: GateInstance[];
}

/**
 * 验证电路是否可以封装成芯片
 */
export function validateCircuit(circuit: Circuit): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 找出所有 INPUT 和 OUTPUT 门
  const inputGates = circuit.gates.filter(g => g.gateDefId === 'input');
  const outputGates = circuit.gates.filter(g => g.gateDefId === 'output');

  // 1. 检查是否有 INPUT 门
  if (inputGates.length === 0) {
    errors.push('至少需要一个 INPUT 门来定义芯片的输入');
  }

  // 2. 检查是否有 OUTPUT 门
  if (outputGates.length === 0) {
    errors.push('至少需要一个 OUTPUT 门来定义芯片的输出');
  }

  // 3. 检查所有 OUTPUT 门是否都能从 INPUT 门到达（连通性检查）
  if (inputGates.length > 0 && outputGates.length > 0) {
    const unreachableOutputs = findUnreachableOutputs(circuit, inputGates, outputGates);
    if (unreachableOutputs.length > 0) {
      errors.push(`以下 OUTPUT 门无法从 INPUT 门通过连线到达: ${unreachableOutputs.map((_, i) => `OUTPUT ${i + 1}`).join(', ')}`);
    }
  }

  // 4. 检查是否有循环依赖（组合逻辑不允许循环）
  if (hasCircularDependency(circuit)) {
    errors.push('检测到循环依赖，组合逻辑电路不允许有环路');
  }

  // 5. 检查悬空的门（可选警告）
  const floatingGates = findFloatingGates(circuit, inputGates, outputGates);
  if (floatingGates.length > 0) {
    warnings.push(`发现 ${floatingGates.length} 个悬空的门（没有连接到输入或输出）`);
  }

  // 6. 检查未连接的引脚
  const unconnectedPins = findUnconnectedPins(circuit);
  if (unconnectedPins > 0) {
    warnings.push(`发现 ${unconnectedPins} 个未连接的引脚`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    inputGates,
    outputGates,
  };
}

/**
 * 查找无法从输入到达的输出门（使用BFS）
 */
function findUnreachableOutputs(
  circuit: Circuit,
  inputGates: GateInstance[],
  outputGates: GateInstance[]
): GateInstance[] {
  const reachable = new Set<string>();
  const queue: string[] = [...inputGates.map(g => g.id)];

  // BFS遍历所有可以从输入到达的门
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (reachable.has(currentId)) continue;

    reachable.add(currentId);

    // 查找从当前门出发的所有连线
    const outgoingWires = circuit.wires.filter(w => w.from.gateId === currentId);
    for (const wire of outgoingWires) {
      if (!reachable.has(wire.to.gateId)) {
        queue.push(wire.to.gateId);
      }
    }
  }

  // 返回不可达的输出门
  return outputGates.filter(g => !reachable.has(g.id));
}

/**
 * 检查是否有循环依赖（使用DFS检测环）
 */
function hasCircularDependency(circuit: Circuit): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(gateId: string): boolean {
    visited.add(gateId);
    recursionStack.add(gateId);

    // 查找从当前门出发的所有连线
    const outgoingWires = circuit.wires.filter(w => w.from.gateId === gateId);
    for (const wire of outgoingWires) {
      const nextId = wire.to.gateId;

      if (!visited.has(nextId)) {
        if (dfs(nextId)) return true;
      } else if (recursionStack.has(nextId)) {
        // 发现环
        return true;
      }
    }

    recursionStack.delete(gateId);
    return false;
  }

  // 对所有门进行DFS
  for (const gate of circuit.gates) {
    if (!visited.has(gate.id)) {
      if (dfs(gate.id)) return true;
    }
  }

  return false;
}

/**
 * 查找悬空的门（既不连接输入也不连接输出）
 */
function findFloatingGates(
  circuit: Circuit,
  inputGates: GateInstance[],
  outputGates: GateInstance[]
): GateInstance[] {
  const ioGateIds = new Set([...inputGates.map(g => g.id), ...outputGates.map(g => g.id)]);
  const connectedGates = new Set<string>();

  // 标记所有通过连线连接的门
  for (const wire of circuit.wires) {
    connectedGates.add(wire.from.gateId);
    connectedGates.add(wire.to.gateId);
  }

  // 返回既不是IO门也不连接的门
  return circuit.gates.filter(g =>
    !ioGateIds.has(g.id) && !connectedGates.has(g.id)
  );
}

/**
 * 计算未连接的引脚数量
 */
function findUnconnectedPins(circuit: Circuit): number {
  const connectedPins = new Set<string>();

  // 收集所有已连接的引脚
  for (const wire of circuit.wires) {
    connectedPins.add(`${wire.from.gateId}-${wire.from.pinId}`);
    connectedPins.add(`${wire.to.gateId}-${wire.to.pinId}`);
  }

  let unconnectedCount = 0;

  // 检查所有门的引脚
  for (const gate of circuit.gates) {
    // 输入引脚
    for (const pin of gate.inputs) {
      const pinKey = `${gate.id}-${pin.id}`;
      if (!connectedPins.has(pinKey)) {
        unconnectedCount++;
      }
    }

    // 输出引脚
    for (const pin of gate.outputs) {
      const pinKey = `${gate.id}-${pin.id}`;
      if (!connectedPins.has(pinKey)) {
        unconnectedCount++;
      }
    }
  }

  return unconnectedCount;
}
