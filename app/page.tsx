import { LaundryGrid } from "@/components/laundry-grid";

export default function Page() {
  return (
    <main className="min-h-screen px-12 py-10">
      <div className="flex gap-16 w-full">
        {/* Left side - Title */}
        <div className="shrink-0">
          <h1 className="text-3xl font-bold tracking-wide text-foreground">
            LAUNDRY_ROOM
          </h1>
        </div>
        
        {/* Right side - Laundry cards */}
        <div className="flex-1">
          <LaundryGrid />
        </div>
      </div>
    </main>
  );
}
