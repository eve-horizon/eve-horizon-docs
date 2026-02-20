import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

/* ----------------------------------------------------------------
   SVG Icons — monoline, 24px, currentColor
   ---------------------------------------------------------------- */

function IconTerminal() {
  return (
    <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function IconManifest() {
  return (
    <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconAgent() {
  return (
    <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  );
}

function IconOrchestrate() {
  return (
    <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3" />
      <circle cx="5" cy="19" r="3" />
      <circle cx="19" cy="19" r="3" />
      <line x1="12" y1="8" x2="5" y2="16" />
      <line x1="12" y1="8" x2="19" y2="16" />
    </svg>
  );
}

function IconDeploy() {
  return (
    <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function IconSkills() {
  return (
    <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

/* ----------------------------------------------------------------
   Hero Section
   ---------------------------------------------------------------- */

function Hero() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={styles.hero}>
      <div className={styles.heroBackground} />
      <div className={styles.heroGlow} />
      <div className={`container ${styles.heroContent}`}>
        <Heading as="h1" className={styles.heroTitle}>
          {siteConfig.title}
        </Heading>
        <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
        <div className={styles.heroButtons}>
          <Link className={styles.heroPrimary} to="/docs/get-started/what-is-eve-horizon">
            Get Started
          </Link>
          <Link className={styles.heroSecondary} to="/docs/reference/cli-commands">
            CLI Reference
          </Link>
        </div>
        <TerminalMockup />
      </div>
    </header>
  );
}

/* ----------------------------------------------------------------
   Terminal Mockup
   ---------------------------------------------------------------- */

function TerminalMockup() {
  return (
    <div className={styles.terminal}>
      <div className={styles.terminalHeader}>
        <span className={styles.terminalDot} />
        <span className={styles.terminalDot} />
        <span className={styles.terminalDot} />
      </div>
      <div className={styles.terminalBody}>
        <div className={styles.terminalLine}>
          <span className={styles.terminalPrompt}>$ </span>
          <span className={styles.terminalCommand}>eve deploy --env staging</span>
        </div>
        <div className={styles.terminalLine}>
          <span className={styles.terminalSuccess}>{'  \u2713 '}</span>
          <span className={styles.terminalLabel}>Build completed in 34s</span>
        </div>
        <div className={styles.terminalLine}>
          <span className={styles.terminalSuccess}>{'  \u2713 '}</span>
          <span className={styles.terminalLabel}>Release eve-api:v2.1.0 created</span>
        </div>
        <div className={styles.terminalLine}>
          <span className={styles.terminalSuccess}>{'  \u2713 '}</span>
          <span className={styles.terminalLabel}>Deployed to staging (3 replicas)</span>
        </div>
        <div className={styles.terminalLine}>
          <span className={styles.terminalSuccess}>{'  \u2713 '}</span>
          <span className={styles.terminalLabel}>Health checks passing</span>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   Feature Cards
   ---------------------------------------------------------------- */

type FeatureItem = {
  title: string;
  description: string;
  link: string;
  icon: () => ReactNode;
};

const features: FeatureItem[] = [
  {
    title: 'CLI-First',
    description:
      'Every operation starts with the eve CLI. One command per task, composable into complex workflows.',
    link: '/docs/get-started/install',
    icon: IconTerminal,
  },
  {
    title: 'Manifest-Driven',
    description:
      'Define services, pipelines, environments, and workflows in a single YAML file.',
    link: '/docs/guides/manifest-authoring',
    icon: IconManifest,
  },
  {
    title: 'Agent-Native',
    description:
      'Built for AI agents from day one. Skills, harnesses, orchestration, and chat.',
    link: '/docs/agent-integration/agent-native-design',
    icon: IconAgent,
  },
  {
    title: 'Job Orchestration',
    description:
      'Every action is a tracked job with lifecycle phases, scheduling hints, and cost accounting.',
    link: '/docs/reference/job-api',
    icon: IconOrchestrate,
  },
  {
    title: 'Deploy with Confidence',
    description:
      'Environment gating, approval workflows, and promotion patterns. Roll back in one command.',
    link: '/docs/operations/deployment',
    icon: IconDeploy,
  },
  {
    title: 'Skills & Packs',
    description:
      'Portable instructions that agents discover and execute. Bundle and distribute across projects.',
    link: '/docs/guides/skills',
    icon: IconSkills,
  },
];

function Feature({ title, description, link, icon: Icon }: FeatureItem) {
  return (
    <div className="col col--4">
      <Link to={link} className={styles.featureLink}>
        <div className={styles.featureCard}>
          <Icon />
          <div className={styles.featureTitle}>{title}</div>
          <p className={styles.featureDescription}>{description}</p>
          <div className={styles.featureArrow}>&rarr;</div>
        </div>
      </Link>
    </div>
  );
}

function Features() {
  return (
    <section className={styles.features}>
      <div className="container">
        <Heading as="h2" className={styles.featuresHeading}>
          Why Eve Horizon
        </Heading>
        <div className="row">
          {features.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------
   Quick Start Strip
   ---------------------------------------------------------------- */

function QuickStart() {
  return (
    <section className={styles.quickStart}>
      <div className="container">
        <Heading as="h2" className={styles.quickStartHeading}>
          Start in 60 Seconds
        </Heading>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>01</div>
            <div className={styles.stepLabel}>Install</div>
            <code className={styles.stepCode}>brew install eve</code>
          </div>
          <div className={styles.stepConnector}>&rarr;</div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>02</div>
            <div className={styles.stepLabel}>Init</div>
            <code className={styles.stepCode}>eve init</code>
          </div>
          <div className={styles.stepConnector}>&rarr;</div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>03</div>
            <div className={styles.stepLabel}>Deploy</div>
            <code className={styles.stepCode}>eve deploy</code>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------
   Page
   ---------------------------------------------------------------- */

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <Hero />
      <main>
        <Features />
        <QuickStart />
      </main>
    </Layout>
  );
}
