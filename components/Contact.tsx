'use client'

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Github, Linkedin, Mail, MapPin, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ContactProps {
  contactInfo: any;
  loading: boolean;
  heroContent: any;
}

const Contact = ({ contactInfo: dbContactInfo, loading, heroContent }: ContactProps) => {
  if (loading) {
    return (
      <section id="contact" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Skeleton className="h-10 w-1/2 mx-auto" />
            <Skeleton className="h-6 w-3/4 mx-auto mt-4" />
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-0 bg-background/60 backdrop-blur-sm">
                <CardContent className="p-8">
                  <Skeleton className="h-8 w-48 mb-6" />
                  <div className="space-y-6">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-5 w-40" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-8 border-t border-border">
                    <Skeleton className="h-6 w-32 mb-4" />
                    <div className="flex gap-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <Skeleton className="h-12 w-12 rounded-lg" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gradient-primary text-primary-foreground">
                <CardContent className="p-8 h-full flex flex-col justify-center">
                  <div className="space-y-6 text-center">
                    <Skeleton className="h-8 w-3/4 mx-auto" />
                    <Skeleton className="h-20 w-full mx-auto" />
                    <div className="space-y-4 pt-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const contactInfo = [
    {
      icon: Mail,
      label: "Email",
      value: dbContactInfo?.email || "abz4375.ayushsrivastava@gmail.com",
      href: `mailto:${dbContactInfo?.email || "abz4375.ayushsrivastava@gmail.com"}`
    },
    {
      icon: MapPin,
      label: "Location",
      value: dbContactInfo?.location || "IIIT Jabalpur, India",
      href: "#"
    }
  ].filter(item => item.value);

  const socialLinks = [
    dbContactInfo?.github_url && {
      icon: Github,
      label: "GitHub",
      href: dbContactInfo.github_url,
      color: "hover:text-gray-900"
    },
    dbContactInfo?.linkedin_url && {
      icon: Linkedin,
      label: "LinkedIn",
      href: dbContactInfo.linkedin_url,
      color: "hover:text-blue-600"
    }
  ].filter(Boolean);

  return (
    <section id="contact" className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-3xl font-bold mb-2">Let's Connect</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Open to new opportunities and collaborations.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact Information */}
            <Card className="border-glow bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">Get In Touch</h3>
                
                <div className="space-y-4">
                  {contactInfo.map((contact, index) => {
                    const IconComponent = contact.icon;
                    return (
                      <div key={index} className="flex items-center gap-3 group">
                        <div className="p-2 rounded-md bg-primary/10">
                          <IconComponent className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{contact.label}</p>
                          {contact.href !== "#" ? (
                            <a 
                              href={contact.href} 
                              className="text-sm text-foreground hover:text-primary transition-colors duration-300 font-medium"
                            >
                              {contact.value}
                            </a>
                          ) : (
                            <p className="text-sm text-foreground font-medium">{contact.value}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Social Links */}
                <div className="mt-6 pt-6 border-t border-border/50">
                  <h4 className="text-md font-semibold mb-3">Follow Me</h4>
                  <div className="flex gap-3">
                    {socialLinks.map((social, index) => {
                      const IconComponent = social.icon;
                      return (
                        <a
                          key={index}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-md bg-secondary hover:bg-accent transition-all duration-300"
                          aria-label={social.label}
                        >
                          <IconComponent className="h-5 w-5" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card className="border-glow bg-gradient-secondary text-foreground">
              <CardContent className="p-6 h-full flex flex-col justify-center">
                <div className="space-y-4 text-center">
                  <h3 className="text-xl font-bold">Ready to Work Together?</h3>
                  
                  <p className="text-sm text-muted-foreground leading-snug">
                    I'm actively seeking full-time opportunities and exciting projects. 
                    Let's create something amazing.
                  </p>

                  <div className="space-y-3 pt-2">
                    <Button size="sm" className="w-full text-xs" asChild>
                      <a href="mailto:abz4375.ayushsrivastava@gmail.com">
                        <Mail className="mr-2 h-3 w-3" />
                        Send Me an Email
                      </a>
                    </Button>

                    <Button size="sm" variant="outline" className="w-full text-xs" asChild>
                      <a href={dbContactInfo?.resume_url || heroContent?.resume_url || "#"} target="_blank" rel="noopener noreferrer" download>
                        <Download className="mr-2 h-3 w-3" />
                        Download Resume
                      </a>
                    </Button>
                  </div>

{/*                   <div className="pt-2 text-xs text-muted-foreground">
                    <p>Graduation Year: 2025</p>
                  </div> */}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
