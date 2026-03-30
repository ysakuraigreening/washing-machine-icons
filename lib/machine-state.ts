// 稼働開始時刻を永続化するためのシンプルなストレージ
// Vercelのサーバーレス環境では、リクエスト間でメモリが共有されないため
// Vercel KVやRedisなどの外部ストレージを使用することを推奨

// 一時的な解決策: グローバル変数 + エッジ関数のウォームスタートを活用
// 注意: コールドスタート時にはリセットされる可能性があります

interface MachineState {
  startTime: string; // ISO timestamp
}

// Node.js環境でグローバルに保持されるオブジェクト
const globalForState = globalThis as unknown as {
  machineStates: Map<string, MachineState> | undefined;
};

// グローバル変数として保持（開発環境でのホットリロード対策）
export const machineStates = globalForState.machineStates ?? new Map<string, MachineState>();

if (process.env.NODE_ENV !== "production") {
  globalForState.machineStates = machineStates;
}

export function getMachineStartTime(machineId: string): Date | undefined {
  const state = machineStates.get(machineId);
  if (state) {
    return new Date(state.startTime);
  }
  return undefined;
}

export function setMachineStartTime(machineId: string, startTime: Date): void {
  machineStates.set(machineId, { startTime: startTime.toISOString() });
}

export function clearMachineStartTime(machineId: string): void {
  machineStates.delete(machineId);
}

export function isMachineRunning(machineId: string): boolean {
  return machineStates.has(machineId);
}
