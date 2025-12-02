import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/home/Hero";
import { Features } from "@/components/home/Features";
import { ProductsSection } from "@/components/home/ProductsSection";
import { CTA } from "@/components/home/CTA";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <ProductsSection />
      <CTA />
      
      {/* Footer placeholder */}
      <footer className="py-12 border-t border-white/10 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} BillSutra. All rights reserved.</p>
      </footer>
    </main>
  );
}
