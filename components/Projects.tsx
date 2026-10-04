'use client'

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, ExternalLink, Calendar, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectsProps {
  projects: any[];
  loading: boolean;
}

const Projects = ({ projects, loading }: ProjectsProps) => {
  const [expandedId, setExpandedId] = useState<string | number | null>(null);

  if (loading) {
    return (
      <section id="projects" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Skeleton className="h-10 w-1/2 mx-auto" />
            <Skeleton className="h-6 w-3/4 mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {[...Array(3)].map((_, index) => (
              <Card key={index} className="bg-background/60 backdrop-blur-sm h-full flex flex-col">
                <CardHeader className="space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-20 w-full" />
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between space-y-6">
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!projects || !Array.isArray(projects)) {
    return (
      <section id="projects" className="py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="text-xl">No projects found</div>
        </div>
      </section>
    );
  }

  return (
    <section id="projects" className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-3xl font-bold mb-2">Featured Projects</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Case studies from production systems — problem, solution, and impact.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
          {projects.map((project, index) => {
            const id = project.id ?? index;
            const isExpanded = expandedId === id;
            const hasCaseStudy = Boolean(
              project.problem || project.solution || project.architecture || project.businessImpact
            );

            return (
              <Card key={id} className="group transition-all duration-300 border-glow bg-card/80 backdrop-blur-sm overflow-hidden h-full flex flex-col">
                {project.image_url && typeof project.image_url === 'string' ? (
                  <div className="relative h-40 w-full bg-muted flex items-center justify-center">
                    <Image
                      src={project.image_url || ''}
                      alt={project.title || 'Project Image'}
                      fill
                      sizes="(min-width: 1280px) 33vw, (min-width: 1024px) 50vw, 100vw"
                      style={{ objectFit: 'cover' }}
                      className="group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-40 w-full bg-muted" />
                )}

                <CardHeader className="space-y-2">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300 leading-tight">
                    {typeof project.title === 'string' ? project.title : 'Untitled Project'}
                  </CardTitle>

                  {project.duration && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{typeof project.duration === 'string' ? project.duration : String(project.duration)}</span>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="flex flex-col space-y-4 flex-1">
                  <p className="text-sm text-foreground/80 leading-snug">
                    {typeof project.description === 'string' ? project.description : 'No description available'}
                  </p>

                  {project.businessImpact && (
                    <p className="text-sm font-medium text-primary">
                      {project.businessImpact}
                    </p>
                  )}

                  {project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {project.technologies
                        .filter((tech: any) => tech && typeof tech.technology === 'string')
                        .map((tech: any, techIndex: number) => (
                          <Badge key={techIndex} variant="secondary" className="text-xs">
                            {tech.technology}
                          </Badge>
                        ))}
                    </div>
                  )}

                  {hasCaseStudy && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : id)}
                      className="flex items-center gap-1.5 text-xs font-medium text-primary hover:opacity-80 transition-opacity"
                      aria-expanded={isExpanded}
                    >
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      {isExpanded ? 'Hide case study' : 'Read the case study'}
                    </button>
                  )}

                  {isExpanded && hasCaseStudy && (
                    <div className="space-y-3 pt-1 border-t border-border/50 mt-1 pt-3">
                      {project.problem && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Problem</p>
                          <p className="text-sm text-foreground/80 leading-snug">{project.problem}</p>
                        </div>
                      )}
                      {project.solution && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Solution</p>
                          <p className="text-sm text-foreground/80 leading-snug">{project.solution}</p>
                        </div>
                      )}
                      {project.architecture && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Architecture</p>
                          <p className="text-sm text-foreground/80 leading-snug">{project.architecture}</p>
                        </div>
                      )}
                      {Array.isArray(project.keyDecisions) && project.keyDecisions.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Key Decisions</p>
                          <ul className="list-disc list-inside space-y-1">
                            {project.keyDecisions.map((d: any, i: number) => (
                              <li key={i} className="text-sm text-foreground/80 leading-snug">{d.decision}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {Array.isArray(project.challenges) && project.challenges.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Challenges</p>
                          <ul className="list-disc list-inside space-y-1">
                            {project.challenges.map((c: any, i: number) => (
                              <li key={i} className="text-sm text-foreground/80 leading-snug">{c.challenge}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 mt-auto">
                    {project.github_url && typeof project.github_url === 'string' && (
                      <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
                        <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                          <Github className="h-3 w-3" />
                          Code
                        </a>
                      </Button>
                    )}

                    {project.demo_url && typeof project.demo_url === 'string' && project.demo_url !== "#" && (
                      <Button size="sm" className="flex-1 text-xs bg-primary/90 hover:bg-primary" asChild>
                        <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                          <ExternalLink className="h-3 w-3" />
                          Live Demo
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Projects;
