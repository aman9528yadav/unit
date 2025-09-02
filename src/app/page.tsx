import { Converter } from "@/components/converter";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-blue-950/20">
      <Converter />
    </main>
  );
}
