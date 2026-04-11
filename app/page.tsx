import { LaundryGrid } from "@/components/laundry-grid";

export default function Page() {
  return (
    <main className="min-h-screen px-16 py-8 flex flex-col">
      {/* Title and Instructions - Top */}
      <div className="font-helvetica text-black mb-8">
        <h1 className="text-6xl font-bold tracking-wide text-foreground mb-6">
          LAUNDRY_ROOM
        </h1>
        <p className="text-4xl">
          メニューに戻るにはリモコンボタンの【PORTAL】を押してください
        </p>
        <p className="text-4xl mt-2">
          Press the【PORTAL】button on the remote to return to the menu.
        </p>
      </div>

      {/* Laundry cards - centered */}
      <div className="flex-1 flex items-center justify-center">
        <LaundryGrid />
      </div>
    </main>
  );
}
