/**
 * SwitchBotデバイス一覧取得スクリプト
 * 
 * 使用方法:
 * 1. このスクリプトの SWITCHBOT_TOKEN と SWITCHBOT_SECRET を
 *    SwitchBotアプリから取得した値に置き換える
 * 2. 実行: npx ts-node scripts/get-switchbot-devices.ts
 * 
 * トークン・シークレットの取得方法:
 * 1. SwitchBotアプリを開く
 * 2. プロフィール → 設定
 * 3. アプリバージョンを10回タップ（開発者モード有効化）
 * 4. 開発者オプション → トークンとシークレットをコピー
 */

import crypto from "crypto";

// ここにSwitchBotアプリから取得した値を入力
const SWITCHBOT_TOKEN = "YOUR_TOKEN_HERE";
const SWITCHBOT_SECRET = "YOUR_SECRET_HERE";

async function getDevices() {
  const t = Date.now().toString();
  const nonce = crypto.randomUUID();
  const data = SWITCHBOT_TOKEN + t + nonce;
  const sign = crypto
    .createHmac("sha256", SWITCHBOT_SECRET)
    .update(data)
    .digest("base64");

  const response = await fetch("https://api.switch-bot.com/v1.1/devices", {
    headers: {
      Authorization: SWITCHBOT_TOKEN,
      sign: sign,
      nonce: nonce,
      t: t,
      "Content-Type": "application/json",
    },
  });

  const result = await response.json();

  if (result.statusCode === 100) {
    console.log("\n=== SwitchBot デバイス一覧 ===\n");
    
    if (result.body.deviceList && result.body.deviceList.length > 0) {
      console.log("【登録済みデバイス】");
      result.body.deviceList.forEach((device: any, index: number) => {
        console.log(`\n${index + 1}. ${device.deviceName}`);
        console.log(`   デバイスID: ${device.deviceId}`);
        console.log(`   タイプ: ${device.deviceType}`);
        if (device.hubDeviceId) {
          console.log(`   ハブID: ${device.hubDeviceId}`);
        }
      });
    } else {
      console.log("登録済みデバイスがありません");
    }

    if (result.body.infraredRemoteList && result.body.infraredRemoteList.length > 0) {
      console.log("\n\n【赤外線リモコン】");
      result.body.infraredRemoteList.forEach((device: any, index: number) => {
        console.log(`\n${index + 1}. ${device.deviceName}`);
        console.log(`   デバイスID: ${device.deviceId}`);
        console.log(`   タイプ: ${device.remoteType}`);
      });
    }

    console.log("\n\n=== 環境変数として設定するもの ===");
    console.log("\n洗濯機に接続されているプラグ（Plug Mini等）のデバイスIDを");
    console.log("SWITCHBOT_DEVICE_001 〜 SWITCHBOT_DEVICE_005 に設定してください。");
    console.log("\n例:");
    console.log("SWITCHBOT_DEVICE_001=XXXXXXXXXXXX");
    console.log("SWITCHBOT_DEVICE_002=XXXXXXXXXXXX");
    console.log("...");
  } else {
    console.error("エラー:", result.message);
  }
}

getDevices().catch(console.error);
