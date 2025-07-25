'use client'

import { useEffect, useState } from 'react'

export function useHeroContent() {
  const [heroContent, setHeroContent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHeroContent() {
      try {
        const response = await fetch('/api/hero-content?depth=1&limit=1');
        const data = await response.json();
        if (data && data.docs && data.docs[0]) {
          setHeroContent(data.docs[0]);
        }
      } catch (error) {
        console.error('Failed to fetch hero content:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchHeroContent();
  }, []);

  return { heroContent, loading };
}

export function useExperiences() {
  const [experiences, setExperiences] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchExperiences() {
      try {
        const response = await fetch('/api/experiences?depth=1&limit=100&sort=sort_order');
        const data = await response.json();
        if (data && data.docs) {
          setExperiences(data.docs.filter(Boolean));
        }
      } catch (error) {
        console.error('Failed to fetch experiences:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchExperiences();
  }, []);

  return { experiences, loading };
}

// CORRECTED: Changed from Supabase to fetch API
export function useProjects() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects?depth=1&limit=100&sort=sort_order');
        const data = await response.json();
        if (data && data.docs) {
          setProjects(data.docs.filter(Boolean));
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  return { projects, loading };
}

export function useSkills() {
  const [skills, setSkills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSkills() {
      try {
        const response = await fetch('/api/skills?depth=1&limit=100');
        const data = await response.json();
        if (data && data.docs) {
          setSkills(data.docs.filter(Boolean));
        }
      } catch (error) {
        console.error('Failed to fetch skills:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSkills();
  }, []);

  return { skills, loading };
}

// CORRECTED: Changed from Supabase to fetch API
export function useContactInfo() {
  const [contactInfo, setContactInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchContactInfo() {
      try {
        const response = await fetch('/api/contact-info?depth=1&limit=1');
        const data = await response.json();
        if (data && data.docs && data.docs[0]) {
          setContactInfo(data.docs[0]);
        }
      } catch (error) {
        console.error('Failed to fetch contact info:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchContactInfo();
  }, []);

  return { contactInfo, loading };
}
