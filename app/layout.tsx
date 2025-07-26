import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: {
    default: "Ayush Srivastava | Software Engineer",
    template: "%s | Ayush Srivastava",
  },
  description:
    "Ayush Srivastava is a passionate Full Stack Software Engineer building scalable web applications and innovative solutions with modern technologies like Next.js, React, Node.js, and more. Explore my portfolio, experience, and projects.",
  keywords: [
    "Ayush Srivastava Portfolio",
    "Ayush Srivastava Full Stack Developer",
    "Full Stack Developer India",
    "MERN Stack Developer Ayush Srivastava",
    "Next.js Developer Portfolio",
    "React.js Developer IIITDMJ",
    "Node.js Backend Developer",
    "TypeScript Web Developer",
    "JavaScript Projects by Ayush",
    "Software Engineer Ayush Srivastava",
    "CollegeCue Project Developer",
    "TeamUp App Developer",
    "Innovative Web Solutions India",
    "Scalable Web Applications Developer",
    "Java Backend and Frontend Developer",
    "Payload CMS Developer India",
    "MongoDB Full Stack Projects",
    "Hackathon-Ready Developer Portfolio",
    "Ayush Srivastava Engineer IIITDMJ",
    "SDE Intern Projects Ayush Srivastava",
  ],
  authors: [{ name: "Ayush Srivastava" }],
  creator: "Ayush Srivastava",
  publisher: "Ayush Srivastava",
  openGraph: {
    title: "Ayush Srivastava | Software Engineer",
    description:
      "Ayush Srivastava is a passionate Full Stack Software Engineer building scalable web applications and innovative solutions with modern technologies.",
    url: "https://sudoayush.netlify.app", // Replace with your actual domain
    siteName: "Ayush Srivastava's Portfolio",
    images: [
      {
        url: "https://sudoayush.netlify.app/ayush.png", // Replace with your actual domain and image path
        width: 800,
        height: 600,
        alt: "Ayush Srivastava's Profile Picture",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ayush Srivastava | Software Engineer",
    description:
      "Ayush Srivastava is a passionate Full Stack Software Engineer building scalable web applications and innovative solutions with modern technologies.",
    creator: "@abz4375", // Replace with your Twitter handle
    images: ["https://sudoayush.netlify.app/ayush.png"], // Replace with your actual domain and image path
  },
  icons: {
    icon: "/ayush.png",
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
    canonical: "https://sudoayush.netlify.app", // Replace with your actual domain
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Ayush Srivastava",
              url: "https://sudoayush.netlify.app", // Replace with your actual domain
              sameAs: [
                "https://www.linkedin.com/in/abz4375/", // Replace with your LinkedIn
                "https://github.com/abz4375", // Replace with your GitHub
                // Add other social media links
              ],
              jobTitle: "Full Stack Software Engineer",
              alumniOf: "IIIT Jabalpur", // Replace with your university
              worksFor: {
                "@type": "Organization",
                name: "Freelance", // Replace with your company/freelance status
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Ayush Srivastava's Portfolio",
              url: "https://sudoayush.netlify.app", // Replace with your actual domain
              potentialAction: {
                "@type": "SearchAction",
                target: "https://sudoayush.netlify.app/?q={search_term_string}", // Replace with your actual domain and search query parameter
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body>
        <Providers>
          <Suspense>{children}</Suspense>
        </Providers>
      </body>
    </html>
  );
}
