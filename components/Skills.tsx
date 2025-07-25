'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code, Database, Globe, Wrench, Trophy, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap = {
  "Primary Languages": Code,
  "Frameworks & Libraries": Globe,
  "Databases": Database,
  "Tools & Technologies": Wrench,
  "Achievements": Trophy,
  "Soft Skills": Users,
};

interface SkillsProps {
  skills: any[];
  loading: boolean;
}

const Skills = ({ skills, loading }: SkillsProps) => {
  if (loading) {
    return (
      <section id="skills" className="py-20 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Skeleton className="h-10 w-1/2 mx-auto" />
            <Skeleton className="h-6 w-3/4 mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="bg-background/60 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-28" />
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
    <section id="skills" className="py-16">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Skills & Expertise</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            My technical toolkit for building and deploying applications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {skills.map((category, index) => {
            const IconComponent = iconMap[category.category as keyof typeof iconMap] || Code;
            return (
              <Card key={index} className="group transition-all duration-300 border-glow bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <IconComponent className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-md group-hover:text-primary transition-colors duration-300">
                      {category.category}
                    </CardTitle>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {category.skills?.filter(Boolean).map((skill, skillIndex) => (
                      <Badge 
                        key={skillIndex} 
                        variant="secondary" 
                        className="text-xs"
                      >
                        {skill.skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional highlight section */}
        <div className="mt-12 max-w-4xl mx-auto">
          <Card className="border-glow bg-gradient-secondary text-foreground">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-bold mb-2">Currently Exploring</h3>
              <p className="text-md text-muted-foreground mb-4">
                Continuously learning and adapting to new technologies.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {["AI/ML Integration", "Cloud Architecture", "DevOps", "Web3", "Microservices"].map((tech, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-xs"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Skills;
