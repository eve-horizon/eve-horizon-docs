import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: 'category',
      label: 'Get Started',
      collapsed: false,
      items: [
        'get-started/what-is-eve-horizon',
        'get-started/install',
        'get-started/quickstart',
        'get-started/core-concepts',
        'get-started/first-deploy',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/manifest-authoring',
        'guides/services-and-databases',
        'guides/pipelines',
        'guides/environments',
        'guides/skills',
        'guides/agents-and-teams',
        'guides/chat',
        'guides/local-development',
        'guides/secrets-and-auth',
        'guides/fullstack-app-design',
        'guides/agentic-app-design',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      items: [
        'reference/cli-commands',
        'reference/manifest-schema',
        'reference/job-api',
        'reference/events-and-webhooks',
        'reference/builds-and-releases',
        'reference/pipelines',
        'reference/workflows',
        'reference/environment-gating',
        'reference/harnesses-and-workers',
        'reference/openapi',
        'reference/cli-appendix',
      ],
    },
    {
      type: 'category',
      label: 'Agent Integration',
      items: [
        'agent-integration/agent-native-design',
        'agent-integration/skills-system',
        'agent-integration/orchestration',
        'agent-integration/chat-gateway',
        'agent-integration/threads',
        'agent-integration/llms-txt',
      ],
    },
    {
      type: 'category',
      label: 'Operations',
      items: [
        'operations/deployment',
        'operations/observability',
        'operations/database',
        'operations/security',
        'operations/troubleshooting',
      ],
    },
  ],
};

export default sidebars;
