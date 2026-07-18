import { getPayload } from 'payload';
import config from '../../payload.config';

export async function getPortfolioData() {
  const payload = await getPayload({ config });

  const [heroContent, experiences, projects, skills, contactInfo, siteSettings] = await Promise.all([
    payload.find({ collection: 'hero-content', limit: 1 }),
    payload.find({ collection: 'experiences', sort: 'sort_order', limit: 100 }),
    payload.find({ collection: 'projects', sort: 'sort_order', limit: 100 }),
    payload.find({ collection: 'skills', sort: 'sort_order', limit: 100 }),
    payload.find({ collection: 'contact-info', limit: 1 }),
    payload.findGlobal({ slug: 'site-settings' }),
  ]);

  return {
    heroContent: heroContent.docs[0] ?? null,
    experiences: experiences.docs,
    projects: projects.docs,
    skills: skills.docs,
    contactInfo: contactInfo.docs[0] ?? null,
    siteSettings: siteSettings ?? null,
  };
}
