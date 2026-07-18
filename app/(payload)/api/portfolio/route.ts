import { NextResponse } from 'next/server';
import { getPortfolioData } from '@/lib/payload/getPortfolioData';

export async function GET() {
  try {
    const portfolioData = await getPortfolioData();
    return NextResponse.json(portfolioData);
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio data' },
      { status: 500 }
    );
  }
}
