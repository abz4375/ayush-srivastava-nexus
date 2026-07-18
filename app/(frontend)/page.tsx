import { getPortfolioData } from '@/lib/payload/getPortfolioData';
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Experience from "@/components/Experience";
import Projects from "@/components/Projects";
import Skills from "@/components/Skills";
import Contact from "@/components/Contact";

export const revalidate = 60;

export default async function Home() {
  const { heroContent, experiences, projects, skills, contactInfo } = await getPortfolioData();

  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero heroContent={heroContent} loading={false} />
      <Experience experiences={experiences} loading={false} />
      <Projects projects={projects} loading={false} />
      <Skills skills={skills} loading={false} />
      <Contact contactInfo={contactInfo} loading={false} heroContent={heroContent} />
    </div>
  );
}
