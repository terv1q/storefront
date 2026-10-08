/**
 * Conditional class names.
 *
 * `clsx` flattens the conditions — strings, arrays, `false`, `undefined` — and
 * `tailwind-merge` then resolves conflicts so the last class for a property
 * wins. That is what lets a component ship defaults and let a caller override
 * one of them without the override depending on stylesheet order.
 *
 * The scale from `tokens.css` is registered below. Tailwind does not know the
 * names `z-header` or `rounded-control`, so without this it would treat them as
 * unknown classes and keep both sides of a conflict.
 */

import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      // The layering scale. Values come from the `z-*` utilities in global.css.
      z: [{ z: ['base', 'sticky', 'header', 'overlay', 'drawer', 'modal', 'toast'] }],
      'max-w': [{ 'max-w': ['page', 'narrow'] }],
      rounded: [{ rounded: ['control', 'card', 'panel'] }],
      'font-size': [{ text: ['display-sm'] }],
      px: [{ px: ['page-x'] }],
    },
  },
});

/** Joins class names, resolving Tailwind conflicts in favour of the last one. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
