import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code, Database, Globe, Wrench, Trophy, Users } from "lucide-react";

const skillCategories = [
  {
    title: "Primary Languages",
    icon: Code,
    skills: ["JavaScript/TypeScript", "C++", "Python"]
  },
  {
    title: "Frameworks & Libraries",
    icon: Globe,
    skills: ["React.js", "Next.js", "Node.js", "Flask", "Django", "Chrome Extensions"]
  },
  {
    title: "Databases",
    icon: Database,
    skills: ["MongoDB", "PostgreSQL", "MySQL", "Firebase"]
  },
  {
    title: "Tools & Technologies",
    icon: Wrench,
    skills: ["Git", "VS Code", "ShadCN/UI", "Material-UI", "Tailwind CSS", "Figma"]
  },
  {
    title: "Achievements",
    icon: Trophy,
    skills: ["Xiaomi Ode2Code 3.0 - Top 1000/60K", "CGPA: 8.0/10 at IIIT Jabalpur"]
  },
  {
    title: "Soft Skills",
    icon: Users,
    skills: ["Team Leadership", "Technical Documentation", "Cross-functional Collaboration"]
  }
];

const Skills = () => {
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
          {skillCategories.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <Card key={index} className="group hover:shadow-elegant transition-all duration-300 border-0 bg-background/60 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">
                      {category.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {category.skills.map((skill, skillIndex) => (
                      <Badge 
                        key={skillIndex} 
                        variant="outline" 
                        className="bg-background/50 hover:bg-primary/10 transition-colors duration-200 text-sm"
                      >
                        {skill}
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