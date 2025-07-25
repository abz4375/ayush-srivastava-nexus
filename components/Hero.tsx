'use client'

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Github, Linkedin, Mail, ArrowDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface HeroProps {
  heroContent: any;
  loading: boolean;
}

const Hero = ({ heroContent, loading }: HeroProps) => {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-50" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-6">
              <Skeleton className="h-16 w-3/4 mx-auto" />
              <Skeleton className="h-8 w-1/2 mx-auto" />
              <Skeleton className="h-6 w-2/3 mx-auto" />
              <Skeleton className="h-24 w-full mx-auto" />
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Skeleton className="h-12 w-40" />
              <Skeleton className="h-12 w-40" />
            </div>
            <div className="flex items-center justify-center gap-6 pt-8">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="hero" className="min-h-screen flex items-center justify-center bg-gradient-hero relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-50" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10 mt-[72px]">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
          {/* Image */}
          <div className="flex-shrink-0">
            <Image
              src="/ayush.png"
              alt="Ayush Srivastava"
              width={150}
              height={150}
              className="rounded-full border-4 border-primary/20 object-cover shadow-elegant lg:w-[200px] lg:h-[200px]"
              priority
            />
          </div>

          {/* Main content */}
          <div className="text-center lg:text-left max-w-2xl space-y-4">
            <h1 className="text-3xl md:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                {heroContent?.name || "Ayush Srivastava"}
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground font-medium">
              {heroContent?.title || "Full-Stack Developer & Computer Science Engineer"}
            </p>
            
            {heroContent?.subtitle && (
              <p className="text-md font-medium text-primary/80 leading-relaxed">
                {heroContent.subtitle}
              </p>
            )}
            
            <p className="text-md text-foreground/80 leading-relaxed">
              {heroContent?.description || "Building scalable web applications and innovative solutions with modern technologies. Currently pursuing B.Tech at IIIT Jabalpur with expertise in React, Next.js, and cloud architecture."}
            </p>
            
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Button 
                onClick={() => scrollToSection('projects')}
                size="lg" 
                className="bg-gradient-primary hover:shadow-glow transition-all duration-300 text-md px-6"
              >
                View My Work
              </Button>
              
              <Button 
                onClick={() => scrollToSection('contact')}
                variant="outline" 
                size="lg"
                className="text-md px-6 hover:bg-secondary/50 transition-all duration-300"
              >
                Get In Touch
              </Button>
            </div>
          </div>
        </div>

        {/* Social links */}
        <div className="flex items-center justify-center gap-6 pt-12">
          {heroContent?.github_url && (
            <a
              href={heroContent.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-background/50 hover:bg-accent transition-all duration-300 hover:shadow-elegant"
            >
              <Github className="h-5 w-5" />
            </a>
          )}
          
          {heroContent?.linkedin_url && (
            <a
              href={heroContent.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-background/50 hover:bg-accent transition-all duration-300 hover:shadow-elegant"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          )}
          
          <a
            href="mailto:abz4375.ayushsrivastava@gmail.com"
            className="p-3 rounded-full bg-background/50 hover:bg-accent transition-all duration-300 hover:shadow-elegant"
          >
            <Mail className="h-5 w-5" />
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ArrowDown className="h-5 w-5 text-muted-foreground" />
      </div>
    </section>
  );
};

export default Hero;
