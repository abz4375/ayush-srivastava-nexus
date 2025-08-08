import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '../../../../payload.config';

export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const [
      heroContent,
      experiences,
      projects,
      skills,
      contactInfo,
      siteSettings,
    ] = await Promise.all([
      payload.find({ collection: 'hero-content' }),
      payload.find({ collection: 'experiences', sort: 'sort_order' }),
      payload.find({ collection: 'projects', sort: 'sort_order' }),
      payload.find({ collection: 'skills', sort: 'sort_order' }),
      payload.find({ collection: 'contact-info' }),
      payload.findGlobal({ slug: 'site-settings' }),
    ]);

    const portfolioData = {
      heroContent: heroContent.docs[0] || null,
      experiences: experiences.docs,
      projects: projects.docs,
      skills: skills.docs,
      contactInfo: contactInfo.docs[0] || null,
      siteSettings: siteSettings || null,
    };

    return NextResponse.json(portfolioData);
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio data' },
      { status: 500 }
    );
  }
}