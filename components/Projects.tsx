'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, ExternalLink, Calendar } from "lucide-react";
import { useProjects } from "@/hooks/useSupabaseData";

const Projects = () => {
  const { projects, loading } = useProjects();

  if (loading) {
    return (
      <section id="projects" className="py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="animate-pulse text-xl">Loading projects...</div>
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
    <section id="projects" className="py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Featured Projects</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Showcasing innovative solutions built with modern technologies
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {projects.map((project, index) => (
            <Card key={project.id || index} className="group hover:shadow-elegant transition-all duration-300 border-0 bg-background/60 backdrop-blur-sm h-full flex flex-col">
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300 leading-tight">
                    {typeof project.title === 'string' ? project.title : 'Untitled Project'}
                  </CardTitle>
                </div>

                {project.duration && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{typeof project.duration === 'string' ? project.duration : String(project.duration)}</span>
                  </div>
                )}

                <p className="text-foreground/80 leading-relaxed">
                  {typeof project.description === 'string' ? project.description : 'No description available'}
                </p>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  {/* Technologies with proper type checking */}
                  {project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {project.technologies
                        .filter(tech => tech && typeof tech.technology === 'string')
                        .map((tech, techIndex) => (
                          <Badge key={techIndex} variant="secondary" className="text-xs bg-secondary/60">
                            {tech.technology}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-4">
                  {project.github_url && typeof project.github_url === 'string' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 hover:bg-secondary/50"
                      asChild
                    >
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <Github className="h-4 w-4" />
                        Code
                      </a>
                    </Button>
                  )}

                  {project.demo_url && 
                   typeof project.demo_url === 'string' && 
                   project.demo_url !== "#" && (
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-primary hover:shadow-glow"
                      asChild
                    >
                      <a
                        href={project.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Live Demo
                      </a>
                    </Button>
                  )}
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
