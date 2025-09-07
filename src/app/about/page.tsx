
import { About } from "@/components/about";
import { Suspense } from "react";

export default function AboutPage() {
  return (
    <Suspense>
      <About />
    </Suspense>
  );
}
