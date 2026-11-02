// Site content. Add a job, project or tool here and the page renders it.
// Strings in `highlights` may contain inline HTML (e.g. <strong>, links).

export const GITHUB_USERNAME = 'tannerbjorgan';

// Icon files live in assets/skills/. Experience tags and the tools marquee look icons up here.
export const technologies = {
  React: 'react.svg',
  TypeScript: 'typescript.svg',
  'Node.js': 'nodedotjs.svg',
  Express: 'express.svg',
  tRPC: 'trpc.svg',
  Docker: 'docker.svg',
  PostgreSQL: 'postgresql.svg',
  SQLite: 'sqlite.svg',
  Prisma: 'prisma.svg',
  Stripe: 'stripe.svg',
  Git: 'git.svg',
  GitHub: 'github.svg',
  'AWS S3': 'amazons3.svg',
  'Google Cloud': 'googlecloud.svg',
  CloudFront: 'amazoncloudfront.svg',
  'Claude Code': 'claude.svg',
  Codex: 'codex.png'
};

export const tools = [
  'React',
  'TypeScript',
  'Node.js',
  'Express',
  'Docker',
  'PostgreSQL',
  'SQLite',
  'Prisma',
  'Git',
  'GitHub',
  'AWS S3',
  'Google Cloud',
  'CloudFront',
  'Claude Code',
  'Codex'
];

export const experience = [
  {
    company: 'Scribeist',
    role: 'Founder & Full Stack Developer',
    period: 'Nov 2024 - Present',
    note: 'Self-funded SaaS',
    logo: { image: 'assets/scribeist-logo.webp' },
    stack: ['React', 'TypeScript', 'Node.js', 'tRPC', 'PostgreSQL', 'Stripe'],
    highlights: [
      'Built and commercialized the platform from first prototype to <strong>3,000+ users</strong>, owning its UI, services, authentication, payments, infrastructure, and release process.',
      'Engineered Mythos live tracking with alias and regex matching, model classification, and cached state inference to keep character status and location aligned with manuscript edits.',
      'Built hybrid retrieval with pgvector similarity, PostgreSQL lexical search, candidate ranking, and evidence-linked output. <a class="text-link" href="#rag-service">See the RAG Service project ↓</a>'
    ]
  },
  {
    company: 'UBC Capstone Program',
    role: 'Technical Lead / Lead Developer',
    period: 'Apr 2025 - Aug 2025',
    note: 'University of British Columbia',
    logo: { text: 'UBC', color: '#002145' },
    stack: ['React', 'Node.js', 'tRPC', 'Prisma', 'PostgreSQL'],
    highlights: [
      'Led a seven-person team building an exam generation and integrity platform that placed <strong>first in the engineering cohort</strong>.',
      'Translated stakeholder needs into requirements, sprint plans, and delivered features across the full software lifecycle.',
      'Coordinated peer review and documentation while accounting for privacy and data-retention requirements.'
    ]
  }
];

export const projects = [
  {
    name: 'Scribeist',
    url: 'https://scribeist.com',
    image: 'assets/projects/scribeist-featured.png',
    imageAlt: 'Scribeist main featured editor image',
    description: 'Writing platform with dedicated workspaces for books, blogs, research, and AI-assisted editing.'
  },
  {
    name: 'LogBook',
    image: 'assets/projects/placeholder.jpg',
    description: 'Offline-first equipment inspections and requests for mining and construction crews.'
  },
  {
    name: 'RAG Service',
    id: 'rag-service',
    image: 'assets/projects/placeholder.jpg',
    description: 'Research retrieval pipeline that finds supporting passages and returns evidence-linked context for AI tools.'
  }
];
