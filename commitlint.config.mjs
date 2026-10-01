/** Conventional Commits — https://www.conventionalcommits.org */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-case': [2, 'always', 'kebab-case'],
    'subject-case': [0],
  },
};
