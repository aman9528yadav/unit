import { Converter } from "@/components/converter";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6">
      <Converter />
    </main>
  );
}
