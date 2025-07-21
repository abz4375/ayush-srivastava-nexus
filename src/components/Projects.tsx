import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, ExternalLink, Calendar } from "lucide-react";

const projects = [
  {
    title: "TeamUp",
    description: "A collaborative project management platform with role-based access control, real-time updates, and task tracking capabilities.",
    period: "June - October 2024",
    technologies: ["TypeScript", "Next.js", "MongoDB", "Material-UI", "Tailwind CSS", "NextAuth"],
    features: [
      "Role-based access control and secure authorization",
      "Real-time project updates and task tracking",
      "RESTful APIs with file attachment support",
      "Google OAuth authentication integration",
      "Responsive design with Material-UI and Tailwind CSS"
    ],
    githubUrl: "https://github.com/abz4375",
    liveUrl: "#",
    status: "Deployed on Vercel"
  },
  {
    title: "Hotel Recommender System",
    description: "An intelligent web mining-based hotel recommendation system using machine learning algorithms for personalized suggestions.",
    period: "November 2024",
    technologies: ["Python", "Selenium", "scikit-learn", "Pandas", "Flask"],
    features: [
      "Web scraping with Selenium for real-time hotel data",
      "Content-based filtering using cosine similarity",
      "12 different amenities and features filtering",
      "Responsive Flask web interface",
      "Real-time recommendation engine"
    ],
    githubUrl: "https://github.com/abz4375",
    liveUrl: "#",
    status: "Available on GitHub"
  },
  {
    title: "FusionIIIT Course Management",
    description: "Comprehensive course administration system serving 300+ students with digital workflows and real-time updates.",
    period: "January - April 2024",
    technologies: ["Django", "PostgreSQL", "Python", "REST API"],
    features: [
      "Digital attendance tracking system",
      "Grade management with PostgreSQL backend",
      "File-sharing system for course materials",
      "RESTful API for seamless integration",
      "Production deployment on fusion.iiitdmj.ac.in"
    ],
    githubUrl: "https://github.com/abz4375",
    liveUrl: "https://fusion.iiitdmj.ac.in",
    status: "Live Production"
  }
];

const Projects = () => {
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
            <Card key={index} className="group hover:shadow-elegant transition-all duration-300 border-0 bg-background/60 backdrop-blur-sm h-full flex flex-col">
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300 leading-tight">
                    {project.title}
                  </CardTitle>
                  <Badge variant="outline" className="bg-primary/5 shrink-0">
                    {project.status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{project.period}</span>
                </div>
                
                <p className="text-foreground/80 leading-relaxed">
                  {project.description}
                </p>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  {/* Technologies */}
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech, techIndex) => (
                      <Badge key={techIndex} variant="secondary" className="text-xs bg-secondary/60">
                        {tech}
                      </Badge>
                    ))}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2">
                    {project.features.slice(0, 3).map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2 text-sm text-foreground/70">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                        <span>{feature}</span>
                      </li>
                    ))}
                    {project.features.length > 3 && (
                      <li className="text-sm text-muted-foreground">
                        +{project.features.length - 3} more features
                      </li>
                    )}
                  </ul>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 hover:bg-secondary/50"
                    asChild
                  >
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <Github className="h-4 w-4" />
                      Code
                    </a>
                  </Button>
                  
                  {project.liveUrl !== "#" && (
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-primary hover:shadow-glow"
                      asChild
                    >
                      <a
                        href={project.liveUrl}
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