// Shape of the content object passed to bootShell(content) at runtime.
// Every field maps 1:1 to a top-level const that existed inline in the
// original index.html. Add fields here → add reads in shell-engine.js.

export type MediumEntry = {
  title: string;
  year: number;
  medium: string;
  dim: string;
  blurb: string;
};

export type ManEntry = {
  name: string;
  desc: string;
  synopsis: string;
  see: string;
};

export type PlateMetaCell = { lab: string; val: string };

export type PlateLink = { lab: string; href: string };

export type ResumeContent = {
  name: string;
  summary: string;
  pdfHref: string;
  previewSrc: string;
  updated: string;
  downloadName: string;
};

export type PlateEntry = {
  // About/contact plates use null for number/year; the engine handles this.
  number: string | null;
  title: string;
  year: number | null;
  marker: string;
  meta: PlateMetaCell[];
  // Optional external links (LIVE / CODE / …) shown as a button row in the
  // plate rail. Omitted plates render no links row.
  links?: PlateLink[];
  // The remaining fields (essay, seams, marginalia, etc.) vary per plate;
  // shell-engine.js reads them structurally so we keep this loose.
  [key: string]: any;
};

export type ShellContent = {
  NOTES: Record<string, string>;
  MEDIUMS: Record<string, MediumEntry>;
  ORDER: string[];
  ABOUT_TEXT: string;
  CONTACT_TEXT: string;
  RESUME: ResumeContent;
  MAN: Record<string, ManEntry>;
  PLATE_DATA: Record<string, PlateEntry>;
  // Optional photo captions keyed by filename; missing keys are normal.
  PHOTO_CAPTIONS: Record<string, string>;
};
