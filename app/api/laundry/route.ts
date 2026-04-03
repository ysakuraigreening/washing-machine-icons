import { NextResponse } from "next/server";
import crypto from "crypto";
import type { LaundryStatus, LaundryMachine } from "@/types/laundry";
import {
  getMachineStartTime,
  setMachineStartTime,
  updatePowerState,
  getPreviousProgress,
  savePreviousProgress,
  resetMachineState,
} from "@/lib/machine-state";
import { resolveLaundryStatus } from "@/lib/laundry-progress";

const SWITCHBOT_API_URL = "https://api.switch-bot.com/v1.1";

// 通電OFF安定判定の閾値（秒）- 完了判定後にリセット
const OFF_STABLE_THRESHOLD_FOR_RESET = 90;

// ========================================
// 本番環境設定: SwitchBotデバイスIDを設定
// ========================================
// 電流閾値はmA単位（SwitchBot APIはmAで返す）
// UNIT_001/002: 3000mA (3A)以上、UNIT_003/004/005: 200mA (0.2A)以上
const LAUNDRY_DEVICES = [
  { id: "unit-001", name: "UNIT_001", deviceId: process.env.SWITCHBOT_DEVICE_001 || "", currentThreshold: 3000 },
  { id: "unit-002", name: "UNIT_002", deviceId: process.env.SWITCHBOT_DEVICE_002 || "", currentThreshold: 3000 },
  { id: "unit-003", name: "UNIT_003", deviceId: process.env.SWITCHBOT_DEVICE_003 || "", currentThreshold: 200 },
  { id: "unit-004", name: "UNIT_004", deviceId: process.env.SWITCHBOT_DEVICE_004 || "", currentThreshold: 200 },
  { id: "unit-005", name: "UNIT_005", deviceId: process.env.SWITCHBOT_DEVICE_005 || "", currentThreshold: 200 },
];

// SwitchBot API署名生成
function generateSignature(token: string, secret: string, timestamp: string, nonce: string): string {
  const data = token + timestamp + nonce;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64");
  return signature;
}

// ランダムなnonce生成
function generateNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

// SwitchBotデバイスのステータスを取得
async function getDeviceStatus(deviceId: string, token: string, secret: string) {
  const timestamp = Date.now().toString();
  const nonce = generateNonce();
  const sign = generateSignature(token, secret, timestamp, nonce);

  const response = await fetch(`${SWITCHBOT_API_URL}/devices/${deviceId}/status`, {
    headers: {
      Authorization: token,
      sign: sign,
      nonce: nonce,
      t: timestamp,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch device ${deviceId}: ${response.statusText}`);
  }

  return response.json();
}

export async function GET() {
  try {
    const token = process.env.SWITCHBOT_TOKEN;
    const secret = process.env.SWITCHBOT_SECRET;

    // 本番モード: SwitchBot APIを使用
    if (token && secret) {
      console.log("[v0] SWITCHBOT_DEVICE_001:", process.env.SWITCHBOT_DEVICE_001 || "not set");
      console.log("[v0] SWITCHBOT_DEVICE_002:", process.env.SWITCHBOT_DEVICE_002 || "not set");
      console.log("[v0] SWITCHBOT_DEVICE_003:", process.env.SWITCHBOT_DEVICE_003 || "not set");
      console.log("[v0] SWITCHBOT_DEVICE_004:", process.env.SWITCHBOT_DEVICE_004 || "not set");
      console.log("[v0] SWITCHBOT_DEVICE_005:", process.env.SWITCHBOT_DEVICE_005 || "not set");
      
      const machines: LaundryMachine[] = await Promise.all(
        LAUNDRY_DEVICES.map(async (device) => {
          if (!device.deviceId) {
            console.log("[v0]", device.name, "has no deviceId configured");
            return {
              id: device.id,
              name: device.name,
              power: "off" as const,
            };
          }

          try {
            console.log("[v0] Fetching status for", device.name, "deviceId:", device.deviceId);
            const status = await getDeviceStatus(device.deviceId, token, secret);
            console.log("[v0]", device.name, "API response:", JSON.stringify(status));
            
            const powerState = status.body?.power;
            const electricCurrent = status.body?.electricCurrent || 0;
            
            console.log("[v0]", device.name, "powerState:", powerState, "electricCurrent:", electricCurrent, "threshold:", device.currentThreshold);
            
            // プラグがONで、電流が閾値以上なら通電中と判断
            // UNIT_001/002: 5A以上、UNIT_003/004/005: 0.2A以上
            const isPowerOn = powerState === "on" && electricCurrent >= device.currentThreshold;
            console.log("[v0]", device.name, "isPowerOn:", isPowerOn);

            // 安定時間を更新・取得
            const { onStableSeconds, offStableSeconds } = updatePowerState(device.id, isPowerOn);

            // 稼働開始時刻の管理
            const existingStartTime = getMachineStartTime(device.id);
            
            if (isPowerOn && !existingStartTime && onStableSeconds >= 15) {
              // 通電ON安定後に開始時刻を記録
              setMachineStartTime(device.id, new Date());
            }

            const startTime = getMachineStartTime(device.id);
            const elapsedSeconds = startTime
              ? Math.floor((Date.now() - startTime.getTime()) / 1000)
              : 0;

            // 進捗計算用の入力を作成
            const previousProgress = getPreviousProgress(device.id);
            const statusResult = resolveLaundryStatus({
              isPowerOn,
              elapsedSeconds,
              onStableSeconds,
              offStableSeconds,
              previousProgress,
            });

            // 進捗率を保存（逆戻り防止用）
            savePreviousProgress(device.id, statusResult.progress);

            // 完了状態でOFF安定が閾値を超えたらリセット
            if (statusResult.state === "completed" && offStableSeconds >= OFF_STABLE_THRESHOLD_FOR_RESET + 60) {
              resetMachineState(device.id);
            }

            return {
              id: device.id,
              name: device.name,
              power: isPowerOn ? "on" : "off",
              elapsedSeconds,
              startTime: startTime?.toISOString(),
              onStableSeconds,
              offStableSeconds,
            } as LaundryMachine;
          } catch (error) {
            console.error(`Error fetching status for ${device.name}:`, error);
            return {
              id: device.id,
              name: device.name,
              power: "off" as const,
            };
          }
        })
      );

      const data: LaundryStatus = {
        machines,
        lastUpdated: new Date().toISOString(),
      };

      return NextResponse.json(data);
    }

    // デモモード: モックデータを返す
    const mockData: LaundryStatus = {
      machines: [
        {
          id: "unit-001",
          name: "UNIT_001",
          power: "on",
          elapsedSeconds: 1200,
          startTime: new Date(Date.now() - 1200000).toISOString(),
          onStableSeconds: 1200,
          offStableSeconds: 0,
        },
        {
          id: "unit-002",
          name: "UNIT_002",
          power: "on",
          elapsedSeconds: 4200,
          startTime: new Date(Date.now() - 4200000).toISOString(),
          onStableSeconds: 4200,
          offStableSeconds: 0,
        },
        {
          id: "unit-003",
          name: "UNIT_003",
          power: "on",
          elapsedSeconds: 5400,
          startTime: new Date(Date.now() - 5400000).toISOString(),
          onStableSeconds: 5400,
          offStableSeconds: 0,
        },
        {
          id: "unit-004",
          name: "UNIT_004",
          power: "off",
          elapsedSeconds: 0,
          onStableSeconds: 0,
          offStableSeconds: 0,
        },
        {
          id: "unit-005",
          name: "UNIT_005",
          power: "off",
          elapsedSeconds: 4920,
          startTime: new Date(Date.now() - 4920000).toISOString(),
          onStableSeconds: 0,
          offStableSeconds: 120,
        },
      ],
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error("Failed to fetch laundry status:", error);
    return NextResponse.json(
      { error: "Failed to fetch laundry status" },
      { status: 500 }
    );
  }
}
