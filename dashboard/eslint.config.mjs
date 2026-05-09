import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';

const eslintConfig = [
  ...nextCoreWebVitals,
  // Project-specific plugin
  {
    plugins: {
      'no-relative-import-paths': noRelativeImportPaths,
    },
    rules: {
      'no-relative-import-paths/no-relative-import-paths': ['warn', { allowSameFolder: true, rootDir: 'src' }],
    },
  },
  // Severity overrides (plugins already in scope from nextCoreWebVitals)
  {
    rules: {
      'react/no-unescaped-entities': 'warn',
      'no-unused-vars': 'warn',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
  // React 19 / React-Compiler-aware hook rules introduced in
  // eslint-plugin-react-hooks 7.x (shipped with eslint-config-next 16).
  // Downgraded to warnings for the Next 16 upgrade PR; revisit alongside
  // the optional React Compiler enablement (plan §8 Phase 4).
  {
    rules: {
      'react-hooks/static-components': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/use-memo': 'warn',
    },
  },
];

export default eslintConfig;
