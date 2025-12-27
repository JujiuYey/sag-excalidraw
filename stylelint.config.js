export default {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-prettier',
  ],
  rules: {
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
