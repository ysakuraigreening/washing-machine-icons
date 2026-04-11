import { LaundryGrid } from "@/components/laundry-grid";

export default function Page() {
  return (
    <main className="min-h-screen px-16 py-12 relative">
      {/* Laundry cards - left side */}
      <div className="max-w-3xl">
        <LaundryGrid />
      </div>
      
      {/* Title and Portal instruction - bottom right */}
      <div className="fixed bottom-12 right-16 text-left font-helvetica text-black">
        <h1 className="text-4xl font-bold tracking-wide text-foreground mb-6">
          LAUNDRY_ROOM
        </h1>
        <p className="text-lg">
          メニューに戻るにはリモコンボタンの【PORTAL】を押してください
        </p>
        <p className="text-base mt-1">
          Press the【PORTAL】button on the remote to return to the menu.
        </p>
      </div>
    </main>
  );
}
