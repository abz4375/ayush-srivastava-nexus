import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Github, Linkedin, Mail, Phone, MapPin, Download } from "lucide-react";
import { useContactInfo } from "@/hooks/useSupabaseData";

const Contact = () => {
  const { contactInfo: dbContactInfo, loading } = useContactInfo();

  if (loading) {
    return (
      <section id="contact" className="py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="animate-pulse text-xl">Loading contact info...</div>
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
      icon: Phone,
      label: "Phone",
      value: dbContactInfo?.phone || "+91 8955848239",
      href: `tel:${dbContactInfo?.phone || "+918955848239"}`
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
    <section id="contact" className="py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Let's Connect</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ready to discuss opportunities, collaborate on projects, or just have a tech conversation
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Information */}
            <Card className="border-0 bg-background/60 backdrop-blur-sm">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6">Get In Touch</h3>
                
                <div className="space-y-6">
                  {contactInfo.map((contact, index) => {
                    const IconComponent = contact.icon;
                    return (
                      <div key={index} className="flex items-center gap-4 group">
                        <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{contact.label}</p>
                          {contact.href !== "#" ? (
                            <a 
                              href={contact.href} 
                              className="text-foreground hover:text-primary transition-colors duration-300 font-medium"
                            >
                              {contact.value}
                            </a>
                          ) : (
                            <p className="text-foreground font-medium">{contact.value}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Social Links */}
                <div className="mt-8 pt-8 border-t border-border">
                  <h4 className="text-lg font-semibold mb-4">Follow Me</h4>
                  <div className="flex gap-4">
                    {socialLinks.map((social, index) => {
                      const IconComponent = social.icon;
                      return (
                        <a
                          key={index}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-all duration-300 hover:shadow-elegant ${social.color}`}
                          aria-label={social.label}
                        >
                          <IconComponent className="h-6 w-6" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card className="border-0 bg-gradient-primary text-primary-foreground">
              <CardContent className="p-8 h-full flex flex-col justify-center">
                <div className="space-y-6 text-center">
                  <h3 className="text-2xl font-bold">Ready to Work Together?</h3>
                  
                  <p className="text-lg opacity-90 leading-relaxed">
                    I'm actively seeking full-time opportunities and exciting projects. 
                    Let's discuss how we can create something amazing together.
                  </p>

                  <div className="space-y-4 pt-4">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="w-full text-lg"
                      asChild
                    >
                      <a href="mailto:abz4375.ayushsrivastava@gmail.com">
                        <Mail className="mr-2 h-5 w-5" />
                        Send Me an Email
                      </a>
                    </Button>

                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full text-lg bg-background/20 border-primary-foreground/20 hover:bg-background/30 text-primary-foreground"
                      asChild
                    >
                      <a href="#" download>
                        <Download className="mr-2 h-5 w-5" />
                        Download Resume
                      </a>
                    </Button>
                  </div>

                  <div className="pt-4 text-sm opacity-75">
                    <p>Currently pursuing B.Tech at IIIT Jabalpur</p>
                    <p>Expected Graduation: 2025</p>
                  </div>
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