import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { LaundryGrid } from "@/components/laundry-grid";

export default function LaundryMonitorPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Header />

        <section>
          <h1 className="text-xl font-semibold text-foreground mb-6">
            ランドリー稼働状況
          </h1>
          <LaundryGrid />
        </section>
      </main>

      <Footer />
    </div>
  );
}
