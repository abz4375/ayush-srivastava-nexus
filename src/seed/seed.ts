import payload from 'payload';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import payloadConfig from '../../payload.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, '../../.env.local'),
});

console.log('PAYLOAD_SECRET:', process.env.PAYLOAD_SECRET ? 'Loaded' : 'Not Loaded');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Loaded' : 'Not Loaded');

const seed = async () => {
  try {
    console.log('Initializing Payload...');
    await payload.init({config:payloadConfig});

    console.log('Payload initialized.');

    // Clear existing data (optional, for development)
    console.log('Clearing existing data...');
    await payload.delete({
      collection: 'hero-content',
      where: {},
    });
    await payload.delete({
      collection: 'experiences',
      where: {},
    });
    await payload.delete({
      collection: 'projects',
      where: {},
    });
    await payload.delete({
      collection: 'skills',
      where: {},
    });
    await payload.delete({
      collection: 'contact-info',
      where: {},
    });
    console.log('Existing data cleared.');

    // Seed Hero Content
    await payload.create({
      collection: 'hero-content',
      data: {
        name: 'Ayush Srivastava',
        title: 'Full-Stack Software Engineer',
        subtitle: 'Designing and developing robust web applications with a focus on user experience and scalable architecture.',
        description: 'A passionate Full-Stack Software Engineer with experience in building and deploying web applications using modern technologies like Next.js, React, Django, and PostgreSQL. Proven ability to lead teams, optimize workflows, and deliver high-quality software solutions.',
        github_url: 'https://github.com/abz4375',
        linkedin_url: 'https://linkedin.com/in/ayush-s-628b77217',
        resume_url: 'https://github.com/abz4375/ayush-srivastava-nexus/raw/main/uploads/Ayush_Srivastava_21BCS049__Infosys_.pdf', // Assuming resume is uploaded to uploads collection
      },
    });
    console.log('Hero Content seeded.');

    // Seed Experiences
    await payload.create({
      collection: 'experiences',
      data: {
        position: 'Full-Stack SDE Intern',
        company: 'BharatTech: CollegeCue',
        achievements: [
          { achievement: 'Designed and improved user interfaces for an educational web platform using Next.js and Tailwind CSS, focusing on responsive design to enhance user experience across devices.' },
          { achievement: 'Developed and integrated a chatbot feature, including message limits and an AI button, while optimizing data storage using parquet files for efficient chatbot data management.' },
          { achievement: 'Contributed to full-stack development by integrating admin frontends for lead management (leads and lead tracker), built with Next.js, and integrated an AI model with the CRM.' },
          { achievement: 'Enhanced backend functionality and real-time communication by applying chat backend optimizations, adding token authorization to Django API routes, developing a Django backend for real-time chat, and integrating websockets with the CollegeCue web app.' },
        ],
        technologies: [
          { technology: 'Next.js' },
          { technology: 'TypeScript' },
          { technology: 'React' },
          { technology: 'Tailwind CSS' },
        ],
        sort_order: 1,
      },
    });

    await payload.create({
      collection: 'experiences',
      data: {
        position: 'Course Management System',
        company: 'FusionIIIT',
        achievements: [
          { achievement: 'Led a team of 5 to optimize course administration workflows, improving operational efficiency and enhancing the user experience.' },
          { achievement: 'Engineered and documented RESTful API specifications for grade management interface using PostgreSQL, ensuring seamless integration and efficient data handling.' },
          { achievement: 'Developed a file-sharing system for course materials, supporting multiple file formats and distributing lecture notes, assignments, and resources to over 300 users each semester.' },
          { achievement: 'Developed an automated digital attendance tracking system, reducing manual intervention by half and enabling real-time student record updates.' },
          { achievement: 'Successfully deployed on fusion.iiitdmj.ac.in' },
        ],
        technologies: [
          { technology: 'Django' },
          { technology: 'PostgreSQL' },
        ],
        sort_order: 2,
      },
    });
    console.log('Experiences seeded.');

    // Seed Projects
    await payload.create({
      collection: 'projects',
      data: {
        title: 'TeamUp',
        description: 'Engineered a scalable collaborative project management platform with role-based access control, optimized for enterprise-level performance. Implemented real-time project updates and task tracking using MongoDB change streams, optimizing application performance through efficient database queries. Developed and documented RESTful APIs for project/task management with file attachment support, ensuring maintainable and scalable code. Integrated Google OAuth authentication and implemented secure authorization middleware for protected routes and API endpoints.',
        duration: 'June 2024 - October 2024',
        technologies: [
          { technology: 'TypeScript' },
          { technology: 'Next.js' },
          { technology: 'MongoDB' },
          { technology: 'Material-UI' },
          { technology: 'Tailwind CSS' },
          { technology: 'NextAuth' },
        ],
        github_url: 'https://github.com/abz4375/TeamUp', // Placeholder, replace with actual if available
        demo_url: 'https://teamup-demo.vercel.app', // Placeholder, replace with actual if available
        image_url: '', // Placeholder for image URL
        sort_order: 1,
      },
    });

    await payload.create({
      collection: 'projects',
      data: {
        title: 'Hotel Recommender System',
        description: 'Engineered a web mining-based hotel recommendation system using Python and Selenium to scrape real-time data from Google Travel (for educational purposes). Implemented a machine learning recommendation engine using scikit-learn’s cosine similarity algorithm to match user preferences with hotel features. Developed a responsive web interface allowing users to filter hotels based on 12 different amenities and features. Built a Flask backend API to handle data processing and real-time recommendations.',
        duration: 'November 2024',
        technologies: [
          { technology: 'Python' },
          { technology: 'Selenium' },
          { technology: 'scikit-learn' },
          { technology: 'Pandas' },
          { technology: 'Flask' },
        ],
        github_url: 'https://github.com/abz4375/Hotel-Recommender-System', // Placeholder, replace with actual if available
        demo_url: '',
        image_url: '', // Placeholder for image URL
        sort_order: 2,
      },
    });
    console.log('Projects seeded.');

    // Seed Skills
    await payload.create({
      collection: 'skills',
      data: {
        category: 'Primary Languages',
        skills: [
          { skill: 'JavaScript/TypeScript' },
          { skill: 'C++' },
          { skill: 'Python (familiar with Flask/Django)' },
        ],
        sort_order: 1,
      },
    });

    await payload.create({
      collection: 'skills',
      data: {
        category: 'Frameworks & Technologies',
        skills: [
          { skill: 'React.js' },
          { skill: 'Next.js' },
          { skill: 'Node.js' },
          { skill: 'Chrome Extensions (Manifest v3)' },
        ],
        sort_order: 2,
      },
    });

    await payload.create({
      collection: 'skills',
      data: {
        category: 'Databases',
        skills: [
          { skill: 'MongoDB' },
          { skill: 'PostgreSQL' },
          { skill: 'MySQL' },
          { skill: 'Firebase' },
        ],
        sort_order: 3,
      },
    });

    await payload.create({
      collection: 'skills',
      data: {
        category: 'Development Environment',
        skills: [
          { skill: 'Git' },
          { skill: 'VS Code' },
        ],
        sort_order: 4,
      },
    });

    await payload.create({
      collection: 'skills',
      data: {
        category: 'Frontend Tools & Libraries',
        skills: [
          { skill: 'Material-UI' },
          { skill: 'Tailwind CSS' },
          { skill: 'Figma' },
        ],
        sort_order: 5,
      },
    });

    await payload.create({
      collection: 'skills',
      data: {
        category: 'Coursework',
        skills: [
          { skill: 'Database Systems' },
          { skill: 'Data Structures & Algorithms' },
        ],
        sort_order: 6,
      },
    });

    await payload.create({
      collection: 'skills',
      data: {
        category: 'Soft Skills',
        skills: [
          { skill: 'Cross-functional team collaboration' },
          { skill: 'Technical documentation' },
        ],
        sort_order: 7,
      },
    });
    console.log('Skills seeded.');

    // Seed Contact Info
    await payload.create({
      collection: 'contact-info',
      data: {
        email: 'abz4375.ayushsrivastava@gmail.com',
        phone: '8955848239',
        location: 'Jabalpur, India', // Inferred from Education
        github_url: 'https://github.com/abz4375',
        linkedin_url: 'https://linkedin.com/in/ayush-s-628b77217'
      },
    });
    console.log('Contact Info seeded.');

    console.log('Database seeding complete!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    // No need to call payload.kill() for a simple seeding script that exits
  }
};

seed();
