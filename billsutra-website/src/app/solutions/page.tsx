import { Navbar } from "@/components/layout/Navbar";

export default function SolutionsPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <h1 className="text-5xl font-bold mb-4">Solutions</h1>
          <p className="text-xl text-gray-400">Industry-specific solutions tailored for your business.</p>
        </div>
      </div>
    </main>
  );
}
