// Site content. Add a job, project or tool here and the pages render it.
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
      'Built hybrid retrieval with pgvector similarity, PostgreSQL lexical search, candidate ranking, and evidence-linked output. <a class="text-link" href="project.html?p=rag-service">See the RAG Service project →</a>'
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

// Each project gets a card on the home page and its own page at project.html?p=<slug>.
// Everything after `description` is optional; sections without content are skipped.
// Stack entries without an icon in `technologies` render as plain tags.
export const projects = [
  {
    slug: 'scribeist',
    name: 'Scribeist',
    description: 'Writing platform with dedicated workspaces for books, blogs, research, and AI-assisted editing.',
    image: 'assets/projects/scribeist-featured.png',
    imageAlt: 'The Scribeist editor',
    tagline: 'A browser-based writing environment that combines structured documents, research and citations, story knowledge, visual planning and AI that answers from the writer’s own work.',
    role: 'Founder & Full Stack Developer',
    period: 'Nov 2024 – Present',
    status: 'Live · 3,000+ users',
    links: [{ label: 'Visit scribeist.com', url: 'https://scribeist.com' }],
    stack: ['React', 'TypeScript', 'Node.js', 'Wasp', 'Prisma', 'PostgreSQL', 'pgvector', 'TipTap', 'Stripe', 'AWS S3', 'CloudFront', 'Sentry'],
    overview: [
      'Scribeist gives each kind of long-form writing its own workspace. Book projects add manuscript organisation, character and world records and timelines; blog projects add generation, SEO analysis and a connected-site audit; general projects keep the shared writing, research and planning tools.',
      'I founded it and built it end to end, taking it from a first prototype to a self-funded product with more than 3,000 users. I own the editor and interface, the server operations and data model, authentication, billing, infrastructure and releases.'
    ],
    sections: [
      {
        title: 'Workspaces',
        bullets: [
          '<strong>Book</strong>, for fiction or nonfiction: a manuscript tree of chapters and scenes, planning templates such as the Hero’s Journey, 7-Point Structure and Truby’s 22 Steps, research, Mythos records and a timeline with calendar, chapter and character views.',
          '<strong>Blog</strong>: posts generated directly or from an editable outline, SEO metadata, readability and passive-voice analysis, and a Site board that crawls a connected site to map internal links and topic clusters.',
          '<strong>General</strong>: notes, reports and research projects with the shared editor, research library and an infinite canvas for mapping ideas.'
        ]
      },
      {
        title: 'Mythos: story knowledge connected to the prose',
        paragraphs: [
          'Writers keep characters, locations, organisations, lore and custom entity types with profiles, aliases and labelled relationships. Mentions are matched and highlighted in the manuscript, and for fiction an optional AI pass infers each character’s status, location and companions from the narrative, using alias and regex matching, model classification and cached state inference so it stays in step with edits.'
        ]
      },
      {
        title: 'Research and citations',
        paragraphs: [
          'A research library keeps sources and notes side by side with the draft. Sources come from files, URLs, DOIs, BibTeX, RIS, CSL JSON or Zotero, keep their page and section provenance, and can be cited inline in 15 styles from APA to IEEE. A browser extension clips pages and selections straight into a workspace.',
          'Behind the AI features is a hybrid retrieval pipeline that finds supporting passages across documents, notes and sources. <a class="text-link" href="project.html?p=rag-service">How the retrieval works →</a>'
        ]
      },
      {
        title: 'AI that stays grounded',
        bullets: [
          'Workspace chat answers from the writer’s own documents, research and Mythos, with citations back to the saved evidence.',
          '“Suggest edits” proposes exact replacements the writer reviews and accepts before anything is saved.',
          'Selection tools expand, shorten, rewrite, change tone or add sensory detail, and writing-style profiles guide output toward the writer’s voice.',
          'Writers can use managed models or bring their own key for OpenAI, Anthropic, Google, xAI, Mistral or OpenRouter, or run local models through Ollama and LM Studio.'
        ]
      },
      {
        title: 'Publishing and portability',
        paragraphs: [
          'Projects import from Markdown, HTML, PDF, DOCX, Kindle KPF, ZIP collections, Google Drive, Notion and Novelcrafter, and export to TXT, Markdown, HTML, DOCX and EPUB with page, typography and cover settings. Documents publish directly to platforms such as Ghost and WordPress, or share as expiring read-only links.'
        ]
      },
      {
        title: 'Billing and the AppSumo launch',
        paragraphs: [
          'Subscriptions run through Stripe with monthly and annual Hobby and Pro plans, bring-your-own-key variants and credit packs. AI usage is metered in credits based on the actual provider and model, with credits reserved up front and settled against actual usage.',
          'I also partnered with AppSumo to sell lifetime licences. That meant building a second licensing path alongside Stripe: activation through AppSumo’s OpenID sign-in, signed webhooks for activations, upgrades, downgrades and deactivations, and four licence tiers mapped onto the same entitlement system as the regular plans. AppSumo customers can also claim bonus credits for leaving a review, granted through an admin queue backed by the credit ledger.'
        ]
      }
    ],
    gallery: [
      { src: 'assets/projects/scribeist/workspaces.jpg', alt: 'Choosing a General, Novel or Blog workspace', caption: 'Choosing a workspace for a new project.' },
      { src: 'assets/projects/scribeist/editor-ai.jpg', alt: 'The editor with the Ask AI menu and a chat continuing a chapter', caption: 'Selection tools and workspace chat that reference chapters, characters and research.' },
      { src: 'assets/projects/scribeist/mythos.jpg', alt: 'Mythos character cards and world-building connections beside a chapter', caption: 'Mythos character tracking and world building beside the manuscript.' },
      { src: 'assets/projects/scribeist/blog-seo.jpg', alt: 'A blog post with SEO readiness and readability scores', caption: 'Blog workspace with SEO and readability analysis.' }
    ]
  },
  {
    slug: 'logbook',
    name: 'LogBook',
    description: 'Offline-first equipment inspections and requests for mining and construction crews.',
    image: 'assets/projects/placeholder.jpg',
    tagline: 'An offline-first equipment logbook for mining and construction crews, replacing paper pre-shift inspections with a signed, auditable record.',
    role: 'Solo developer',
    period: 'Apr 2026 – Present',
    status: 'In development',
    stack: ['TypeScript', 'React Native', 'Expo', 'SQLite', 'Zustand', 'Node.js', 'Express', 'PostgreSQL', 'Zod', 'Docker'],
    overview: [
      'Heavy equipment has to be inspected and signed off every shift, and that record matters for safety audits and legal claims. On remote mine and construction sites it is usually done on paper, because the phone signal can’t be relied on.',
      'LogBook moves that process onto the phone without depending on a connection. Operators inspect each machine and sign, supervisors review and countersign, anyone can request supplies or repairs, and admins get a complete, tamper-evident record for audits.'
    ],
    sections: [
      {
        title: 'Built for each role',
        bullets: [
          '<strong>Operators</strong> walk through a pre-shift checklist for each machine, mark items OK, caution or critical with remarks and photos, and sign.',
          '<strong>Supervisors</strong> review the crew’s inspections and sign them off one at a time or as a batch with a single signature, and handle requests.',
          '<strong>Anyone</strong> can request supplies, equipment or repairs, marked normal or urgent, and follow them from pending to resolved.',
          '<strong>Admins</strong> see every inspection, the audit trail, people, machines and company settings, with CSV and PDF exports, on the phone or in a laptop browser.'
        ]
      },
      {
        title: 'Offline first',
        paragraphs: [
          'Every action is written to an on-device SQLite database and an outbox in the same transaction, so nothing is lost when there is no signal. A sync engine pushes queued operations and photos whenever a connection returns — on launch, on reconnect, after each write and every two minutes — then pulls changes. Operations are idempotent and applied independently, so retries are safe and one failure never blocks the rest.',
          'An inspection in progress survives the app being killed, supervisors can countersign offline, and the server clock, not the device’s, decides what has changed since the last sync.'
        ]
      },
      {
        title: 'A record that holds up in an audit',
        bullets: [
          'Each submitted inspection stores a SHA-256 hash of its canonical content, and signed logs are never edited.',
          'The audit trail is append-only, enforced by a database trigger that rejects updates and deletes.',
          'Both the time on the device and the time the server received the record are kept.',
          'Photos live in PostgreSQL with the logs, so one backup holds the complete record, and they are only served through short-lived signed URLs.'
        ]
      },
      {
        title: 'Multi-tenant and secure',
        paragraphs: [
          'One deployment serves many companies, and companies can sign themselves up. Every query is scoped to the organisation in the access token, never the request body. Sign-in uses bcrypt-hashed passwords, 15-minute access tokens and hashed, revocable refresh tokens, with rate limiting on sign-in and sign-up. On the device, tokens live in the Keychain or Keystore and unsynced work is only ever pushed with the credentials of the person who created it.'
        ]
      },
      {
        title: 'One codebase, every platform',
        paragraphs: [
          'The Expo app ships to iOS and Android and builds for the web, where the same Express server hosts it as the admin dashboard. Types and validation are shared between the app and API, and the whole system runs as a single Docker deployment on PostgreSQL.'
        ]
      }
    ]
  },
  {
    slug: 'rag-service',
    name: 'RAG Service',
    description: 'Research retrieval pipeline that finds supporting passages and returns evidence-linked context for AI tools.',
    image: 'assets/projects/placeholder.jpg',
    tagline: 'The hybrid retrieval pipeline behind Scribeist’s AI: it finds the passages that support an answer across a writer’s documents, notes and sources, and returns them with links back to the evidence.',
    role: 'Built for Scribeist',
    period: 'Mar 2026 – Present',
    status: 'In production',
    links: [{ label: 'Part of Scribeist', url: 'project.html?p=scribeist', internal: true }],
    stack: ['TypeScript', 'Node.js', 'PostgreSQL', 'pgvector', 'Prisma', 'OpenAI'],
    overview: [
      'Writers ask Scribeist’s AI about their own work — a manuscript, research notes, imported papers — and expect answers grounded in it. This service finds the relevant passages and hands them to the model with enough provenance that every claim can be traced back to its source.',
      'It indexes three kinds of content in each workspace: writing documents, research notes and research sources, including the page and section a passage came from.'
    ],
    sections: [
      {
        title: 'Indexing',
        bullets: [
          'Text is split into roughly 400-token chunks with a 50-token overlap, keeping character offsets so results can be located in the original.',
          'Chunks are embedded with OpenAI’s text-embedding-3-small model and stored in PostgreSQL with pgvector.',
          'Every chunk is hashed, so after an edit only new content is re-embedded — even when earlier edits shift later chunks to new positions. Stale embedding responses can’t overwrite newer ones.'
        ]
      },
      {
        title: 'Hybrid search',
        paragraphs: [
          'Each query runs two searches. Vector similarity finds passages that are close in meaning; PostgreSQL full-text search catches exact names and terms that embeddings tend to blur, using prefix matching with filler words removed.',
          'Results from both are merged per chunk and re-scored: the stronger of the two signals sets the base, passages found by both get a boost, and further boosts reward chunks containing the query’s key terms — more when several appear together. That keeps a search for a character or a specific study from being drowned out by passages that are only loosely related.'
        ]
      },
      {
        title: 'Evidence-linked output',
        paragraphs: [
          'Chat answers cite the saved passages they used, so writers can follow a claim back to its source. Given a selected passage, the service can also find the sources that support it, or draft a short continuation from supplied evidence only — validating the supporting excerpts and returning “no support” rather than inventing one.'
        ]
      },
      {
        title: 'Scoped and observable',
        paragraphs: [
          'Retrieval is bound to the signed-in user and workspace, so one project’s material never leaks into another. Retrieval telemetry is recorded for the admin dashboard, and the ranking and indexing logic is covered by unit tests.'
        ]
      }
    ]
  }
];
