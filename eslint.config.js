import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';

/**
 * Accessibility linting for the storefront's markup.
 *
 * The rules this plugin brings cover what can be decided by reading a file: an
 * image with no alternative text, a control with no accessible name, a label
 * pointing at nothing, a press handler on something no keyboard can reach. They
 * cannot decide whether the name is a good one, whether the reading order makes
 * sense, or whether the colours are legible — those need a browser and a person,
 * and are recorded as limits in `CHECKLIST.md` rather than pretended to here.
 *
 * It runs over the client's TSX only. The server renders no markup, and the test
 * files are left out because a test that draws a fragment on purpose is not a
 * page anybody visits.
 *
 * The peer range the plugin declares ends at ESLint 9 while the project is on 10,
 * so the install warns. The rules do run — the first pass over this codebase
 * found fifteen real problems — and the warning is the plugin's metadata being
 * older than the linter, not the plugin failing.
 */
export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/prisma/generated/**',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['client/src/**/*.tsx'],
    ...jsxA11y.flatConfigs.recommended,
  },
  {
    files: ['client/src/**/*.tsx'],
    rules: {
      /**
       * A radio card — the delivery method, the payment method — is a `label`
       * wrapping the input on the left and two stacked lines on the right, so
       * the method's name sits two elements inside the label. The rule stops
       * looking at depth 2 by default and reports the label as having no text,
       * which is wrong here: the name is `strings.checkout.…`, the browser
       * computes it from the label's own contents, and it is exactly the name
       * the card shows. The depth is raised to reach it rather than the markup
       * being flattened into something the rule can count.
       */
      'jsx-a11y/label-has-associated-control': ['error', { depth: 3 }],

      /**
       * A horizontally scrolling row of links is a tab stop on purpose: without
       * one it can be scrolled by wheel and by finger but not by the arrow keys,
       * which is the pattern the W3C describes for a labelled scrollable region.
       * The roles that pattern uses are named here so the rule stops calling the
       * tab stop a mistake.
       */
      'jsx-a11y/no-noninteractive-tabindex': [
        'error',
        { tags: [], roles: ['tabpanel', 'region'], allowExpressionValues: true },
      ],
    },
  },
  {
    /**
     * The gallery frame carries a key handler, and it is right for it to: the
     * frame is a region the keyboard can enter, and once inside it the arrow keys
     * move to the next and previous picture. The rule would rather the keys were
     * only on the two arrow buttons, which is the plainer pattern — but the frame
     * is also where the magnifier and the swipe live, so it is already the
     * element the visitor's attention and pointer are on, and putting paging
     * there as well costs nothing and saves a tab stop.
     */
    files: ['client/src/components/product/ProductGallery.tsx'],
    rules: {
      'jsx-a11y/no-noninteractive-element-interactions': 'off',
    },
  },
  {
    /**
     * A tab list and a radio group are containers: the arrow keys move between
     * the members, and the container itself is never focused. `role="tablist"`
     * around three tabs and `role="radiogroup"` around five stars are both the
     * pattern the W3C describes, and the members inside them carry the tab stop
     * and the keyboard handling. The rule assumes an interactive role means a
     * focusable element, which is true of a lone `role="button"` and not true of
     * a composite widget's container.
     */
    files: [
      'client/src/components/product/ProductTabs.tsx',
      'client/src/components/product/StarRatingInput.tsx',
    ],
    rules: {
      'jsx-a11y/interactive-supports-focus': 'off',
    },
  },
  prettier,
);
