import { NextResponse } from "next/server";
import type { LaundryStatus } from "@/types/laundry";

// SwitchBot API integration placeholder
// In production, this would call SwitchBot API to get device status
const SWITCHBOT_API_URL = "https://api.switch-bot.com/v1.1";

export async function GET() {
  try {
    // Check if SwitchBot credentials are configured
    const token = process.env.SWITCHBOT_TOKEN;
    const secret = process.env.SWITCHBOT_SECRET;

    if (token && secret) {
      // TODO: Implement actual SwitchBot API call
      // const response = await fetch(`${SWITCHBOT_API_URL}/devices`, {
      //   headers: {
      //     "Authorization": token,
      //     "sign": generateSign(token, secret),
      //     "nonce": generateNonce(),
      //     "t": Date.now().toString(),
      //   },
      // });
    }

    // For demo purposes, return mock data
    // This simulates SwitchBot plug status (ON = laundry running, OFF = stopped)
    const mockData: LaundryStatus = {
      machines: [
        {
          id: "unit-001",
          name: "UNIT_001",
          power: "on",
          elapsedSeconds: 1200, // 20 minutes
          startTime: new Date(Date.now() - 1200000).toISOString(),
        },
        {
          id: "unit-002",
          name: "UNIT_002",
          power: "off",
        },
        {
          id: "unit-003",
          name: "UNIT_003",
          power: "on",
          elapsedSeconds: 2100, // 35 minutes
          startTime: new Date(Date.now() - 2100000).toISOString(),
        },
        {
          id: "unit-004",
          name: "UNIT_004",
          power: "off",
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
