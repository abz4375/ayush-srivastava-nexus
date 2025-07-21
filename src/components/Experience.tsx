import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar } from "lucide-react";

const experiences = [
  {
    title: "Full-Stack SDE Intern",
    company: "BharatTech: CollegeCue",
    period: "January 2025 - Present",
    type: "Internship",
    technologies: ["Next.js", "TypeScript", "React", "FastAPI", "MySQL"],
    achievements: [
      "Architected and developed comprehensive Lead Management System and CRM from scratch with role-based access control",
      "Built full-stack educational platform features with real-time chat functionality using WebSockets",
      "Integrated multiple AI models (Mistral, Gemini) for chatbot functionality and automated report summarization",
      "Developed and optimized RESTful APIs using FastAPI with JWT authentication and PayloadCMS integration"
    ]
  },
  {
    title: "Course Management System Developer",
    company: "FusionIIIT",
    period: "January - April 2024",
    type: "Project",
    technologies: ["Django", "PostgreSQL", "Python"],
    achievements: [
      "Led a team of 5 to optimize course administration workflows for 300+ students",
      "Engineered RESTful API specifications for grade management interface using PostgreSQL",
      "Developed file-sharing system for course materials and digital attendance tracking",
      "Successfully deployed on official server fusion.iiitdmj.ac.in"
    ]
  }
];

const Experience = () => {
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
                      {exp.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span className="font-medium">{exp.company}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{exp.period}</span>
                    </div>
                    <Badge variant="secondary" className="w-fit">
                      {exp.type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Technologies */}
                <div className="flex flex-wrap gap-2">
                  {exp.technologies.map((tech, techIndex) => (
                    <Badge key={techIndex} variant="outline" className="bg-primary/5 hover:bg-primary/10 transition-colors">
                      {tech}
                    </Badge>
                  ))}
                </div>

                {/* Achievements */}
                <ul className="space-y-3">
                  {exp.achievements.map((achievement, achIndex) => (
                    <li key={achIndex} className="flex items-start gap-3 text-foreground/80">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                      <span className="leading-relaxed">{achievement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;