import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Eve Horizon',
  tagline: 'Ship software with AI-powered workflows',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://docs.eve-horizon.dev',
  baseUrl: '/',

  organizationName: 'incept5',
  projectName: 'eve-horizon-docs',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },

  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/incept5/eve-horizon-docs/edit/main/website/',
          showLastUpdateTime: true,
        },
        blog: {
          path: 'blog',
          routeBasePath: 'changelog',
          blogTitle: 'Changelog',
          blogDescription: 'Eve Horizon release notes and announcements',
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    '@docusaurus/plugin-ideal-image',
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        indexBlog: false,
        docsRouteBasePath: '/docs',
        highlightSearchTermsOnTargetPage: true,
      },
    ],
    [
      '@signalwire/docusaurus-plugin-llms-txt',
      {
        content: {
          enableMarkdownFiles: true,
          enableLlmsFullTxt: true,
          includeBlog: false,
          includePages: false,
          includeDocs: true,
        },
      },
    ],
  ],

  themeConfig: {
    image: 'img/eve-social-card.png',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Eve Horizon',
      logo: {
        alt: 'Eve Horizon',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/changelog',
          label: 'Changelog',
          position: 'left',
        },
        {
          href: 'https://github.com/incept5/eve-horizon',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Get Started',
          items: [
            { label: 'What is Eve Horizon?', to: '/docs/get-started/what-is-eve-horizon' },
            { label: 'Quickstart', to: '/docs/get-started/quickstart' },
          ],
        },
        {
          title: 'Reference',
          items: [
            { label: 'CLI Commands', to: '/docs/reference/cli-commands' },
            { label: 'Manifest Schema', to: '/docs/reference/manifest-schema' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'Changelog', to: '/changelog' },
            { label: 'GitHub', href: 'https://github.com/incept5/eve-horizon' },
          ],
        },
      ],
      copyright: `Copyright ${new Date().getFullYear()} Incept5. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'yaml', 'json', 'toml'],
    },
    mermaid: {
      theme: { light: 'neutral', dark: 'dark' },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
