import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-2xl text-5xl font-bold tracking-tight sm:text-6xl">
          Build projects together
        </h1>
        <p className="mt-6 max-w-lg text-lg text-muted-foreground">
          Discover projects, join teams, and gain real-world engineering
          experience. CollabHub connects developers who want to build something
          meaningful.
        </p>
        <div className="mt-10 flex gap-4">
          <Button size="lg" asChild>
            <Link href="/projects">Browse Projects</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/register">Get Started</Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        CollabHub &mdash; A platform for engineers to collaborate and grow.
      </footer>
    </div>
  );
}
