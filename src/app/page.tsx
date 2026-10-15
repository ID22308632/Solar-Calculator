"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-black">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <Sun className="text-[#b10f3b]" size={27} />
          <span className="text-xl font-bold">SolarCheck</span>
        </div>

        <span className="text-sm text-gray-500">
          Solar Energy
        </span>
      </nav>

      <section className="mx-auto flex max-w-5xl flex-col items-center px-6 py-28 text-center">
        <p className="text-sm font-semibold text-[#b10f3b]">
          SOLAR ASSESSMENT
        </p>

        <h1 className="mt-4 max-w-3xl text-5xl font-bold tracking-tight md:text-6xl">
          Explore your solar project
        </h1>

        <p className="mt-5 max-w-xl text-lg text-gray-500">
          Record your building, preferred system, demo roof selection and electricity input in five steps. This prototype does not assess real roof suitability or calculate solar savings.
        </p>

        <Button
          onClick={() => router.push("/assessment")}
          className="mt-9 gap-2 rounded-full bg-[#b10f3b] px-7 text-white hover:bg-[#8f0c30]"
        >
          Start / Resume
          <ArrowRight size={17} />
        </Button>
        <p className="mt-4 max-w-xl text-sm leading-6 text-gray-600">
          Your draft stays in this browser tab when storage is available. Return here to resume, or use Start Again on the summary to clear it. The final summary can be printed or saved as PDF.
        </p>
      </section>
    </main>
  );
}
