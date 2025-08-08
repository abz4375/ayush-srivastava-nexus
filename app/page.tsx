'use client'

import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Experience from "@/components/Experience";
import Projects from "@/components/Projects";
import Skills from "@/components/Skills";
import Contact from "@/components/Contact";
import ChatbotWidget from "@/components/Chatbot/ChatbotWidget";
import {
  useHeroContent,
  useExperiences,
  useProjects,
  useSkills,
  useContactInfo,
} from "@/hooks/useSupabaseData";

export default function Home() {
  const { heroContent, loading: loadingHero } = useHeroContent();
  const { experiences, loading: loadingExperiences } = useExperiences();
  const { projects, loading: loadingProjects } = useProjects();
  const { skills, loading: loadingSkills } = useSkills();
  const { contactInfo, loading: loadingContactInfo } = useContactInfo();

  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero heroContent={heroContent} loading={loadingHero} />
      <Experience experiences={experiences} loading={loadingExperiences} />
      <Projects projects={projects} loading={loadingProjects} />
      <Skills skills={skills} loading={loadingSkills} />
      <Contact contactInfo={contactInfo} loading={loadingContactInfo} heroContent={heroContent} />
      <ChatbotWidget />
    </div>
  );
}
