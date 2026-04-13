import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = [
  // Start from Next's recommended rules so lint acts as a real quality gate
  // for App Router, React, and TypeScript code.
  ...nextVitals,
  ...nextTs,
  {
    // Build artifacts and generated files should not participate in lint.
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'coverage/**',
      'next-env.d.ts',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Keep TypeScript strict on hand-written source files.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      // These React Compiler-oriented rules are temporarily disabled because
      // the current codebase still contains patterns that would produce a lot
      // of noise. The rest of the React/Next rules remain active.
      'react-hooks/error-boundaries': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];

export default eslintConfig;
