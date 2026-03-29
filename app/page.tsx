import { Footer } from "@/components/footer";
import { LaundryGrid } from "@/components/laundry-grid";

export default function Page() {
  return (
    <main className="min-h-screen px-6 py-8">
      <div className="flex gap-12 max-w-4xl">
        {/* Left side - Title */}
        <div className="shrink-0">
          <h1 className="text-2xl font-bold tracking-wide text-foreground">
            LAUNDRY_ROOM
          </h1>
        </div>
        
        {/* Right side - Laundry cards */}
        <div className="flex-1">
          <LaundryGrid />
        </div>
      </div>
      <Footer />
    </main>
  );
}
