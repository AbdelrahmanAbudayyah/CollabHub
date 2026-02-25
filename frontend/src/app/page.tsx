"use client";

/**
 * Enhanced Home Page (Slice 8)
 *
 * Features:
 * - Hero section with CTA buttons
 * - Latest recruiting projects showcase
 * - Browse by school section
 * - Popular tech stacks section
 *
 * "use client" required for:
 * - useEffect to fetch latest projects
 * - useState for loading/data state
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/lib/context/AuthContext";
import { getProjects } from "@/lib/api/projects";
import { Project } from "@/lib/types/project";
import { Users, ArrowRight } from "lucide-react";

/**
 * Popular schools to showcase (subset from schools.ts)
 * Using major research universities for initial MVP
 */
const FEATURED_SCHOOLS = [
  { name: "MIT", fullName: "Massachusetts Institute of Technology" },
  { name: "Stanford", fullName: "Stanford University" },
  { name: "UC Berkeley", fullName: "University of California, Berkeley" },
  { name: "CMU", fullName: "Carnegie Mellon University" },
  { name: "Georgia Tech", fullName: "Georgia Institute of Technology" },
  { name: "UT Austin", fullName: "University of Texas at Austin" },
];

/**
 * Popular tech stacks to showcase
 * Using common web/mobile development stacks
 * skillId matches the skill.id from the database
 */
const POPULAR_STACKS = [
  { name: "React", skillId: 11, color: "bg-blue-100 text-blue-800" },
  { name: "Express.js", skillId: 17, color: "bg-green-100 text-green-800" },
  { name: "Python", skillId: 3, color: "bg-yellow-100 text-yellow-800" },
  { name: "TypeScript", skillId: 2, color: "bg-indigo-100 text-indigo-800" },
  { name: "PostgreSQL", skillId: 24, color: "bg-purple-100 text-purple-800" },
  { name: "Docker", skillId: 22, color: "bg-cyan-100 text-cyan-800" },
  { name: "Next.js", skillId: 12, color: "bg-gray-800 text-white" },
  { name: "Spring Boot", skillId: 15, color: "bg-emerald-100 text-emerald-800" },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch latest recruiting projects on mount
  useEffect(() => {
    getProjects({ status: "RECRUITING", page: 0, size: 4 })
      .then((response) => setProjects(response.content))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* ─── Hero Section ─────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col">
        <section className="flex flex-col items-center justify-center px-6 py-20 text-center">
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
            {!isAuthenticated && (
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            )}
          </div>
        </section>

        {/* ─── Featured Recruiting Projects ────────────────────────────── */}
        <section className="border-t bg-muted/30 px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold">Featured Projects</h2>
                <p className="mt-2 text-muted-foreground">
                  Join teams that are actively recruiting members
                </p>
              </div>
              <Button variant="ghost" asChild>
                <Link href="/projects?status=RECRUITING">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="h-48 animate-pulse bg-muted" />
                ))}
              </div>
            ) : projects.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {projects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
                      <CardHeader>
                        <CardTitle className="line-clamp-1 text-base">
                          {project.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 text-xs">
                          {project.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-1">
                          {project.skills.slice(0, 2).map((skill) => (
                            <Badge key={skill.id} variant="secondary" className="text-xs">
                              {skill.name}
                            </Badge>
                          ))}
                          {project.skills.length + project.customSkills.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{project.skills.length + project.customSkills.length - 2}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>by {project.ownerFirstName}</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {project.members.length}/{project.maxTeamSize}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-12 text-center">
                <p className="text-muted-foreground">
                  No recruiting projects yet. Be the first to create one!
                </p>
                <Button asChild className="mt-4" variant="outline">
                  <Link href="/projects/create">Create Project</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* ─── Browse by School ─────────────────────────────────────────── */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8">
              <h2 className="text-3xl font-bold">Browse by School</h2>
              <p className="mt-2 text-muted-foreground">
                Connect with students from top universities
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURED_SCHOOLS.map((school) => (
                <Link
                  key={school.name}
                  href={`/projects?school=${encodeURIComponent(school.fullName)}`}
                >
                  <Card className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg">{school.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {school.fullName}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Button variant="outline" asChild>
                <Link href="/projects">
                  View all schools
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ─── Popular Stacks ───────────────────────────────────────────── */}
        <section className="border-t bg-muted/30 px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8">
              <h2 className="text-3xl font-bold">Popular Tech Stacks</h2>
              <p className="mt-2 text-muted-foreground">
                Explore projects using the technologies you want to learn
              </p>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              {POPULAR_STACKS.map((stack) => (
                <Link
                  key={stack.name}
                  href={`/projects?skillIds=${stack.skillId}`}
                >
                  <Badge
                    className={`${stack.color} cursor-pointer px-6 py-3 text-base font-medium transition-transform hover:scale-105`}
                  >
                    {stack.name}
                  </Badge>
                </Link>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Button asChild>
                <Link href="/projects">
                  Explore all projects
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        CollabHub &mdash; A platform for engineers to collaborate and grow.
      </footer>
    </div>
  );
}
