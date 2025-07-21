import { Button } from "@/components/ui/button";
import { Github, Linkedin, Mail, ArrowDown } from "lucide-react";
import { useHeroContent } from "@/hooks/useSupabaseData";

const Hero = () => {
  const { heroContent, loading } = useHeroContent();
  
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="animate-pulse text-2xl">Loading...</div>
      </section>
    );
  }

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-hero relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-50" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="container mx-auto px-6 text-center relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Main content */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                {heroContent?.name || "Ayush Srivastava"}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground font-medium">
              {heroContent?.title || "Full-Stack Developer & Computer Science Engineer"}
            </p>
            
            {heroContent?.subtitle && (
              <p className="text-lg font-medium text-primary/80 max-w-2xl mx-auto leading-relaxed">
                {heroContent.subtitle}
              </p>
            )}
            
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto leading-relaxed">
              {heroContent?.description || "Building scalable web applications and innovative solutions with modern technologies. Currently pursuing B.Tech at IIIT Jabalpur with expertise in React, Next.js, and cloud architecture."}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              onClick={() => scrollToSection('projects')}
              size="lg" 
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300 text-lg px-8"
            >
              View My Work
            </Button>
            
            <Button 
              onClick={() => scrollToSection('contact')}
              variant="outline" 
              size="lg"
              className="text-lg px-8 hover:bg-secondary/50 transition-all duration-300"
            >
              Get In Touch
            </Button>
          </div>

          {/* Social links */}
          <div className="flex items-center justify-center gap-6 pt-8">
            {heroContent?.github_url && (
              <a
                href={heroContent.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-full bg-background/50 hover:bg-background transition-all duration-300 hover:shadow-elegant"
              >
                <Github className="h-6 w-6" />
              </a>
            )}
            
            {heroContent?.linkedin_url && (
              <a
                href={heroContent.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-full bg-background/50 hover:bg-background transition-all duration-300 hover:shadow-elegant"
              >
                <Linkedin className="h-6 w-6" />
              </a>
            )}
            
            <a
              href="mailto:abz4375.ayushsrivastava@gmail.com"
              className="p-3 rounded-full bg-background/50 hover:bg-background transition-all duration-300 hover:shadow-elegant"
            >
              <Mail className="h-6 w-6" />
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ArrowDown className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>
    </section>
  );
};

export default Hero;