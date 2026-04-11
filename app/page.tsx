import { LaundryGrid } from "@/components/laundry-grid";

export default function Page() {
  return (
    <main className="min-h-screen px-16 py-8 flex flex-col">
      {/* Title and Instructions - Top */}
      <div className="font-helvetica text-black mb-6">
        <h1 className="text-5xl font-bold tracking-wide text-foreground mb-4">
          LAUNDRY_ROOM
        </h1>
        <p className="text-2xl">
          メニューに戻るにはリモコンボタンの【PORTAL】を押してください
        </p>
        <p className="text-2xl mt-1">
          Press the【PORTAL】button on the remote to return to the menu.
        </p>
      </div>

      {/* Laundry cards with Price/Location - flex layout */}
      <div className="flex-1 flex items-center justify-center gap-12">
        {/* Price and Location Info - Left side */}
        <div className="font-helvetica text-black">
          <div className="text-2xl font-bold mb-4">PRICE</div>
          <div className="text-2xl space-y-2 mb-6">
            <p>洗濯＊＊＊円 | ＊＊分</p>
            <p>洗濯乾燥＊＊＊円 | ＊＊分</p>
            <p>追加乾燥＊＊＊円 | ＊＊分</p>
          </div>
          <div className="text-2xl">
            LOCATION : HOTEL 2F
          </div>
        </div>

        {/* Laundry cards - Right side */}
        <LaundryGrid />
      </div>
    </main>
  );
}
