import { NextResponse } from "next/server";
import crypto from "crypto";

function generateSignature(token: string, secret: string, t: string, nonce: string) {
  const data = token + t + nonce;
  return crypto.createHmac("sha256", secret).update(data).digest("base64");
}

export async function GET() {
  const token = process.env.SWITCHBOT_TOKEN;
  const secret = process.env.SWITCHBOT_SECRET;

  if (!token || !secret) {
    return NextResponse.json({ error: "SwitchBot credentials not configured" }, { status: 500 });
  }

  const t = Date.now().toString();
  const nonce = crypto.randomUUID();
  const sign = generateSignature(token, secret, t, nonce);

  try {
    const response = await fetch("https://api.switch-bot.com/v1.1/devices", {
      headers: {
        Authorization: token,
        sign: sign,
        nonce: nonce,
        t: t,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    
    // デバイス一覧を返す
    return NextResponse.json({
      devices: data.body?.deviceList || [],
      infraredDevices: data.body?.infraredRemoteList || [],
      raw: data,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
