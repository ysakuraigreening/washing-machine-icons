import { LaundryGrid } from "@/components/laundry-grid";

export default function Page() {
  return (
    <main className="min-h-screen px-16 py-12">
      {/* Title */}
      <h1 className="text-4xl font-bold tracking-wide text-foreground mb-10">
        LAUNDRY_ROOM
      </h1>
      
      {/* Laundry cards */}
      <LaundryGrid />
    </main>
  );
}
