import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Suspense } from "react";
import ChatbotWidget from "@/components/Chatbot/ChatbotWidget";
import { getPortfolioData } from "@/lib/payload/getPortfolioData";

export async function generateMetadata(): Promise<Metadata> {
  const { siteSettings, contactInfo } = await getPortfolioData();

  const siteTitle = siteSettings?.siteTitle || "Ayush Srivastava | Software Engineer";
  const siteUrl = siteSettings?.siteUrl || "https://sudoayush.netlify.app";
  const description =
    siteSettings?.siteDescription ||
    "Ayush Srivastava is a Software Engineer building scalable web applications and innovative solutions with modern technologies like Next.js, React, and Node.js.";
  const ogImageUrl =
    typeof siteSettings?.ogImage === "object" && siteSettings?.ogImage?.url
      ? siteSettings.ogImage.url
      : `${siteUrl}/ayush.png`;

  return {
    title: {
      default: siteTitle,
      template: `%s | ${siteSettings?.brandName || "Ayush Srivastava"}`,
    },
    description,
    authors: [{ name: siteSettings?.personName || "Ayush Srivastava" }],
    creator: siteSettings?.personName || "Ayush Srivastava",
    publisher: siteSettings?.personName || "Ayush Srivastava",
    openGraph: {
      title: siteTitle,
      description,
      url: siteUrl,
      siteName: siteTitle,
      images: [{ url: ogImageUrl, width: 800, height: 600, alt: `${siteSettings?.personName || "Ayush Srivastava"}'s Profile Picture` }],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description,
      creator: siteSettings?.twitterHandle || "@abz4375",
      images: [ogImageUrl],
    },
    icons: {
      icon:
        typeof siteSettings?.favicon === "object" && siteSettings?.favicon?.url
          ? siteSettings.favicon.url
          : "/ayush.png",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: true,
        "max-video-preview": -1,
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: siteUrl,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { siteSettings, contactInfo } = await getPortfolioData();
  const siteUrl = siteSettings?.siteUrl || "https://sudoayush.netlify.app";
  const personName = siteSettings?.personName || "Ayush Srivastava";

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: personName,
              url: siteUrl,
              sameAs: [contactInfo?.linkedin_url, contactInfo?.github_url].filter(Boolean),
              jobTitle: siteSettings?.personJobTitle || "Software Engineer",
              alumniOf: siteSettings?.personAlmaMater || undefined,
              worksFor: siteSettings?.personWorksFor
                ? { "@type": "Organization", name: siteSettings.personWorksFor }
                : undefined,
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: siteSettings?.siteTitle || `${personName}'s Portfolio`,
              url: siteUrl,
              potentialAction: {
                "@type": "SearchAction",
                target: `${siteUrl}/?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body>
        <Providers>
          <Suspense>{children}</Suspense>
          <ChatbotWidget />
        </Providers>
      </body>
    </html>
  );
}
