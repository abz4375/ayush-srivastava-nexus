'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

export function useHeroContent() {
  const [heroContent, setHeroContent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHeroContent() {
      const { data, error } = await (supabase as any)
        .from('hero_content')
        .select('*')
        .limit(1)
        .single()

      if (data) {
        setHeroContent(data)
      }
      setLoading(false)
    }

    fetchHeroContent()
  }, [])

  return { heroContent, loading }
}

export function useExperiences() {
  const [experiences, setExperiences] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchExperiences() {
      const { data, error } = await (supabase as any)
        .from('experiences')
        .select('*')
        .order('sort_order', { ascending: true })

      if (data) {
        setExperiences(data)
      }
      setLoading(false)
    }

    fetchExperiences()
  }, [])

  return { experiences, loading }
}

export function useProjects() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProjects() {
      const { data, error } = await (supabase as any)
        .from('projects')
        .select('*')
        .order('sort_order', { ascending: true })

      if (data) {
        setProjects(data)
      }
      setLoading(false)
    }

    fetchProjects()
  }, [])

  return { projects, loading }
}

export function useSkills() {
  const [skills, setSkills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSkills() {
      const { data, error } = await (supabase as any)
        .from('skills')
        .select('*')
        .order('sort_order', { ascending: true })

      if (data) {
        setSkills(data)
      }
      setLoading(false)
    }

    fetchSkills()
  }, [])

  return { skills, loading }
}

export function useContactInfo() {
  const [contactInfo, setContactInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchContactInfo() {
      const { data, error } = await (supabase as any)
        .from('contact_info')
        .select('*')
        .limit(1)
        .single()

      if (data) {
        setContactInfo(data)
      }
      setLoading(false)
    }

    fetchContactInfo()
  }, [])

  return { contactInfo, loading }
}