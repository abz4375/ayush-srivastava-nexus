'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar } from "lucide-react";
import { useExperiences } from "@/hooks/useSupabaseData";

const Experience = () => {
  const { experiences, loading } = useExperiences();

  if (loading) {
    return (
      <section id="experience" className="py-20 bg-secondary/30">
        <div className="container mx-auto px-6 text-center">
          <div className="animate-pulse text-xl">Loading experiences...</div>
        </div>
      </section>
    );
  }
  return (
    <section id="experience" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Experience</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Building real-world solutions and leading development teams
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {experiences.map((exp, index) => (
            <Card key={index} className="group hover:shadow-elegant transition-all duration-300 border-0 bg-background/60 backdrop-blur-sm">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-2">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">
                      {exp.position}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span className="font-medium">{exp.company}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{exp.duration}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Technologies */}
                {exp.technologies && (
                  <div className="flex flex-wrap gap-2">
                    {exp.technologies.filter(Boolean).map((tech, techIndex) => (
                      <Badge key={techIndex} variant="outline" className="bg-primary/5 hover:bg-primary/10 transition-colors">
                        {tech.technology}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Achievements */}
                {exp.description && (
                  <ul className="space-y-3">
                    {exp.description.filter(Boolean).map((achievement, achIndex) => (
                      <li key={achIndex} className="flex items-start gap-3 text-foreground/80">
                        <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                        <span className="leading-relaxed">{achievement.achievement}</span>
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
