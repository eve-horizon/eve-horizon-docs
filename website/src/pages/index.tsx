import type { ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function Hero() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={styles.hero}>
      <div className="container">
        <Heading as="h1" className={styles.heroTitle}>
          {siteConfig.title}
        </Heading>
        <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
        <div className={styles.heroButtons}>
          <Link
            className="button button--primary button--lg"
            to="/docs/get-started/what-is-eve-horizon"
          >
            Get Started
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/docs/reference/cli-commands"
          >
            CLI Reference
          </Link>
        </div>
      </div>
    </header>
  );
}

type FeatureItem = {
  title: string;
  description: string;
  link: string;
};

const features: FeatureItem[] = [
  {
    title: 'CLI-First',
    description:
      'Every operation starts with the eve CLI. One command per task, composable into complex workflows.',
    link: '/docs/get-started/install',
  },
  {
    title: 'Manifest-Driven',
    description:
      'Define services, pipelines, environments, and workflows in a single YAML file.',
    link: '/docs/guides/manifest-authoring',
  },
  {
    title: 'Agent-Native',
    description:
      'Built for AI agents from day one. Skills, harnesses, orchestration, and chat.',
    link: '/docs/agent-integration/agent-native-design',
  },
  {
    title: 'Job Orchestration',
    description:
      'Every action is a tracked job with lifecycle phases, scheduling hints, and cost accounting.',
    link: '/docs/reference/job-api',
  },
  {
    title: 'Deploy with Confidence',
    description:
      'Environment gating, approval workflows, and promotion patterns. Roll back in one command.',
    link: '/docs/operations/deployment',
  },
  {
    title: 'Skills & Packs',
    description:
      'Portable instructions that agents discover and execute. Bundle and distribute across projects.',
    link: '/docs/guides/skills',
  },
];

function Feature({ title, description, link }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <Link to={link} className={styles.featureLink}>
        <div className={styles.featureCard}>
          <Heading as="h3">{title}</Heading>
          <p>{description}</p>
        </div>
      </Link>
    </div>
  );
}

function Features() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {features.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <Hero />
      <main>
        <Features />
      </main>
    </Layout>
  );
}
