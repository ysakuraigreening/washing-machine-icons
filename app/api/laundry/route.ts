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
const LAUNDRY_DEVICES = [
  { id: "unit-001", name: "UNIT_001", deviceId: process.env.SWITCHBOT_DEVICE_001 || "" },
  { id: "unit-002", name: "UNIT_002", deviceId: process.env.SWITCHBOT_DEVICE_002 || "" },
  { id: "unit-003", name: "UNIT_003", deviceId: process.env.SWITCHBOT_DEVICE_003 || "" },
  { id: "unit-004", name: "UNIT_004", deviceId: process.env.SWITCHBOT_DEVICE_004 || "" },
  { id: "unit-005", name: "UNIT_005", deviceId: process.env.SWITCHBOT_DEVICE_005 || "" },
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
      const machines: LaundryMachine[] = await Promise.all(
        LAUNDRY_DEVICES.map(async (device) => {
          if (!device.deviceId) {
            return {
              id: device.id,
              name: device.name,
              power: "off" as const,
            };
          }

          try {
            const status = await getDeviceStatus(device.deviceId, token, secret);
            
            const powerState = status.body?.power;
            const electricCurrent = status.body?.electricCurrent || 0;
            
            // プラグがONで、電流が流れている（0.01A以上）なら通電中と判断
            // SwitchBot APIのelectricCurrentはA単位で返される
            const isPowerOn = powerState === "on" && electricCurrent > 0.01;

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
