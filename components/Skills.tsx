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
    <section id="skills" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Skills & Expertise</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A comprehensive toolkit for modern software development
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {skills.map((category, index) => {
            const IconComponent = iconMap[category.category as keyof typeof iconMap] || Code;
            return (
              <Card key={index} className="group hover:shadow-elegant transition-all duration-300 border-0 bg-background/60 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">
                      {category.category}
                    </CardTitle>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {category.skills?.filter(Boolean).map((skill, skillIndex) => (
                      <Badge 
                        key={skillIndex} 
                        variant="outline" 
                        className="bg-background/50 hover:bg-primary/10 transition-colors duration-200 text-sm"
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
        <div className="mt-16 max-w-4xl mx-auto">
          <Card className="border-0 bg-gradient-primary text-primary-foreground">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Currently Learning & Exploring</h3>
              <p className="text-lg opacity-90 mb-6">
                Always staying ahead of the curve with emerging technologies
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {["AI/ML Integration", "Cloud Architecture", "DevOps", "Web3", "Microservices"].map((tech, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="bg-background/20 text-primary-foreground hover:bg-background/30 transition-colors"
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
