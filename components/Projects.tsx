'use client'

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, ExternalLink, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectsProps {
  projects: any[];
  loading: boolean;
}

const Projects = ({ projects, loading }: ProjectsProps) => {
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

  // Safety check for projects data
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
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Featured Projects</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A selection of projects that showcase my skills and passion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {projects.map((project, index) => (
            <Card key={project.id || index} className="group transition-all duration-300 border-glow bg-card/80 backdrop-blur-sm h-full flex flex-col overflow-hidden">
              {project.image_url && typeof project.image_url === 'string' ? (
                <div className="relative h-40 w-full">
                  <Image
                    src={project.image_url}
                    alt={project.title || 'Project Image'}
                    layout="fill"
                    objectFit="cover"
                    className="group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : <div className="relative h-40 w-full bg-secondary" />}
              
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

              <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                <p className="text-sm text-foreground/80 leading-snug flex-1">
                  {typeof project.description === 'string' ? project.description : 'No description available'}
                </p>

                <div className="space-y-4">
                  {project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {project.technologies
                        .filter(tech => tech && typeof tech.technology === 'string')
                        .map((tech, techIndex) => (
                          <Badge key={techIndex} variant="secondary" className="text-xs">
                            {tech.technology}
                          </Badge>
                        ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
