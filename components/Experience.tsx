'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ExperienceProps {
  experiences: any[];
  loading: boolean;
}

const Experience = ({ experiences, loading }: ExperienceProps) => {
  if (loading) {
    return (
      <section id="experience" className="py-20 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Skeleton className="h-10 w-1/2 mx-auto" />
            <Skeleton className="h-6 w-3/4 mx-auto mt-4" />
          </div>
          <div className="max-w-4xl mx-auto space-y-8">
            {[...Array(3)].map((_, index) => (
              <Card key={index} className="bg-background/60 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                    <Skeleton className="h-5 w-24" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-5/6" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section id="experience" className="py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-3xl font-bold mb-2">Experience</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A timeline of my professional journey and key accomplishments.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-8">
          {experiences.map((exp, index) => (
            <Card key={index} className="group transition-all duration-300 border-glow bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">
                      {exp.position}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span className="font-medium">{exp.company}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0 mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>{exp.duration}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                {/* Technologies */}
                {exp.technologies && (
                  <div className="flex flex-wrap gap-2">
                    {exp.technologies.filter(Boolean).map((tech, techIndex) => (
                      <Badge key={techIndex} variant="secondary" className="text-xs">
                        {tech.technology}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Achievements */}
                {exp.achievements && Array.isArray(exp.achievements) && (
                  <ul className="space-y-2 pl-4">
                    {exp.achievements.filter(Boolean).map((achievement, achIndex) => (
                      <li key={achIndex} className="flex items-start gap-2 text-sm text-foreground/80">
                        <span className="text-primary flex-shrink-0">&gt;</span>
                        <span className="leading-snug">{achievement.achievement}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;
