import { Navbar } from "@/components/layout/Navbar";

export default function CompanyPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <h1 className="text-5xl font-bold mb-4">Company</h1>
          <p className="text-xl text-gray-400">Learn more about BillSutra and our mission.</p>
        </div>
      </div>
    </main>
  );
}
