import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { LaundryGrid } from "@/components/laundry-grid";

export default function Page() {
  return (
    <main className="min-h-screen px-6 py-8 max-w-4xl mx-auto">
      <Header />
      <LaundryGrid />
      <Footer />
    </main>
  );
}
