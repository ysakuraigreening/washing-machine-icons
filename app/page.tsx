import { LaundryGrid } from "@/components/laundry-grid";

export default function Page() {
  return (
    <main className="min-h-screen px-16 py-8 flex flex-col bg-background">
      {/* Title and Instructions - Top */}
      <div className="mb-8">
        <h1 className="text-6xl font-light tracking-tight text-foreground mb-6">
          LAUNDRY_ROOM
        </h1>
        <p className="text-xl text-foreground/80 leading-relaxed">
          メニューへ戻るにはリモコンボタンの【PORTAL】を押してください
        </p>
        <p className="text-xl text-foreground/80 leading-relaxed mt-2">
          Press the【PORTAL】button on the remote to return to the menu.
        </p>
      </div>

      {/* Price and Location Info - Left aligned, below press text */}
      <div className="mb-10">
        <div className="text-lg font-light text-foreground mb-4">PRICE</div>
        <div className="text-lg text-foreground/80 space-y-2 mb-6">
          <p>洗濯＊＊＊円 | ＊＊分</p>
          <p>洗濯乾燥＊＊＊円 | ＊＊分</p>
          <p>追加乾燥＊＊＊円 | ＊＊分</p>
        </div>
        <div className="text-lg text-foreground/80">
          LOCATION : HOTEL 2F
        </div>
      </div>

      {/* Laundry cards - centered */}
      <div className="flex-1 flex items-center justify-center">
        <LaundryGrid />
      </div>
    </main>
  );
}
