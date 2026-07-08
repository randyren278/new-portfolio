// Phase 1 content loader: reads directly from the static snapshot in data.ts.
// In Phase 2 this file gets rewritten to build the same shape from Postgres.
// The signature (async function returning a ShellContent) stays stable so
// page.tsx never has to change.

import type { ShellContent } from './types';
import {
  ABOUT_TEXT,
  COLOPHON_TEXT,
  CONTACT_TEXT,
  MAN,
  MEDIUMS,
  NOTES,
  ORDER,
  PLATE_DATA,
} from './data';

export async function loadShellContent(): Promise<ShellContent> {
  return {
    NOTES,
    MEDIUMS,
    ORDER,
    ABOUT_TEXT,
    CONTACT_TEXT,
    COLOPHON_TEXT,
    MAN,
    PLATE_DATA,
  };
}
