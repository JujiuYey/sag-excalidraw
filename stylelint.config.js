export default {
  extends: [
    'stylelint-config-standard',
  ],
  rules: {
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'plugin',
          'theme',
          'source',
          'utility',
          'variant',
          'custom-variant',
          'config',
          'tailwind',
          'apply',
          'layer',
          'screen',
        ],
      },
    ],
    'selector-class-pattern': null,
    'selector-id-pattern': null,
    'custom-property-pattern': null,
    'keyframes-name-pattern': null,
  },
  ignoreFiles: [
    'node_modules/',
    'dist/',
    'build/',
    '.tauri/',
  ],
};
