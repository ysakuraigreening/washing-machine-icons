import { NextResponse } from "next/server";
import crypto from "crypto";
import type { LaundryStatus, LaundryMachine } from "@/types/laundry";
import {
  getMachineStartTime,
  setMachineStartTime,
  clearMachineStartTime,
} from "@/lib/machine-state";

const SWITCHBOT_API_URL = "https://api.switch-bot.com/v1.1";

// ========================================
// 本番環境設定: SwitchBotデバイスIDを設定
// ========================================
// 各ランドリーマシンに接続されたSwitchBotプラグのデバイスIDを設定してください
// デバイスIDはSwitchBotアプリまたはAPIから取得できます
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

    // デバッグ: 環境変数の状態を確認
    console.log("[v0] SWITCHBOT_TOKEN exists:", !!token);
    console.log("[v0] SWITCHBOT_SECRET exists:", !!secret);
    console.log("[v0] SWITCHBOT_DEVICE_001:", process.env.SWITCHBOT_DEVICE_001 || "not set");

    // 本番モード: SwitchBot APIを使用
    if (token && secret) {
      console.log("[v0] Running in production mode - SwitchBot API");
      
      const machines: LaundryMachine[] = await Promise.all(
        LAUNDRY_DEVICES.map(async (device) => {
          if (!device.deviceId) {
            console.log("[v0] Device ID not set for:", device.name);
            // デバイスIDが設定されていない場合はオフとして扱う
            return {
              id: device.id,
              name: device.name,
              power: "off" as const,
            };
          }

          try {
            console.log("[v0] Fetching status for:", device.name, "deviceId:", device.deviceId);
            const status = await getDeviceStatus(device.deviceId, token, secret);
            console.log("[v0] SwitchBot API response for", device.name, ":", JSON.stringify(status));
            
            // SwitchBotプラグミニの稼働判定
            // power: "on"/"off" - プラグの電源状態
            // electricCurrent: 電流値（mA）- 洗濯機が実際に動いているかの判定に使用
            const powerState = status.body?.power;
            const electricCurrent = status.body?.electricCurrent || 0;
            
            // プラグがONで、電流が流れている（20mA以上）なら稼働中と判断
            const isRunning = powerState === "on" && electricCurrent > 20;
            console.log("[v0]", device.name, "powerState:", powerState, "electricCurrent:", electricCurrent, "mA, isRunning:", isRunning);

            // 稼働開始/終了時刻の管理（永続化ストレージを使用）
            const existingStartTime = getMachineStartTime(device.id);
            
            if (isRunning && !existingStartTime) {
              // 稼働開始: 開始時刻を記録
              setMachineStartTime(device.id, new Date());
            } else if (!isRunning && existingStartTime) {
              // 稼働終了: 開始時刻をクリア
              clearMachineStartTime(device.id);
            }

            const startTime = getMachineStartTime(device.id);
            const elapsedSeconds = startTime
              ? Math.floor((Date.now() - startTime.getTime()) / 1000)
              : undefined;

            return {
              id: device.id,
              name: device.name,
              power: isRunning ? "on" : "off",
              elapsedSeconds,
              startTime: startTime?.toISOString(),
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
    console.log("[v0] Running in demo mode - SwitchBot credentials not configured");
    const mockData: LaundryStatus = {
      machines: [
        {
          id: "unit-001",
          name: "UNIT_001",
          power: "on",
          elapsedSeconds: 1200,
          startTime: new Date(Date.now() - 1200000).toISOString(),
        },
        {
          id: "unit-002",
          name: "UNIT_002",
          power: "on",
          elapsedSeconds: 1200,
          startTime: new Date(Date.now() - 1200000).toISOString(),
        },
        {
          id: "unit-003",
          name: "UNIT_003",
          power: "on",
          elapsedSeconds: 1200,
          startTime: new Date(Date.now() - 1200000).toISOString(),
        },
        {
          id: "unit-004",
          name: "UNIT_004",
          power: "off",
        },
        {
          id: "unit-005",
          name: "UNIT_005",
          power: "on",
          elapsedSeconds: 2100,
          startTime: new Date(Date.now() - 2100000).toISOString(),
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
