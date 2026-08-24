const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'identity',
        'community',
        'projects',
        'social',
        'api',
        'web',
        'infra',
        'deps',
        'docs',
        'adr',
        'roadmap',
        'deploy',
        'ci',
      ],
    ],
  },
};

export default config;
