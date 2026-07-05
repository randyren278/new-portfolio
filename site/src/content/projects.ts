export const ORDER = ['oryzo', 'halcyon', 'aperture', 'fieldnote', 'signal-garden', 'loom'] as const;
export type Slug = (typeof ORDER)[number];

export type ProjectMeta = {
  slug: Slug;
  kicker: string;
  title: string;
  artist: string;
  year: number;
  medium: string;
  dim: string;
  collection: string;
  blurb: string;
  hint: string;
};

const WALL_LABEL_KICKER = '§ Wall label';
const ARTIST = 'Randy Ren';
const COLLECTION = 'Collection of the artist';

function hintFor(slug: Slug): string {
  return `Type <span class="lk">open ${slug}</span> to see the plate.`;
}

export const PROJECTS: Record<Slug, ProjectMeta> = {
  oryzo: {
    slug: 'oryzo',
    kicker: WALL_LABEL_KICKER,
    title: 'ORYZO',
    artist: ARTIST,
    year: 2025,
    medium: 'voice orchestration, latency, code',
    dim: '300ms, dimensions variable',
    collection: COLLECTION,
    blurb: 'Voice orchestration layer for autonomous agents. Turned 300ms of latency into a feature.',
    hint: hintFor('oryzo')
  },
  halcyon: {
    slug: 'halcyon',
    kicker: WALL_LABEL_KICKER,
    title: 'HALCYON',
    artist: ARTIST,
    year: 2025,
    medium: 'multiplayer, canvas, webgl',
    dim: '500,000 cursors',
    collection: COLLECTION,
    blurb: 'Realtime collaborative canvas for design teams. Half a million multiplayer cursors and counting.',
    hint: hintFor('halcyon')
  },
  aperture: {
    slug: 'aperture',
    kicker: WALL_LABEL_KICKER,
    title: 'APERTURE',
    artist: ARTIST,
    year: 2024,
    medium: 'mobile os, camera, concept',
    dim: '1 device, 100 apps',
    collection: COLLECTION,
    blurb: 'Camera-first mobile OS. The lens is the app launcher.',
    hint: hintFor('aperture')
  },
  fieldnote: {
    slug: 'fieldnote',
    kicker: WALL_LABEL_KICKER,
    title: 'FIELDNOTE',
    artist: ARTIST,
    year: 2024,
    medium: 'cli, journaling, ai',
    dim: 'one shell, infinite pages',
    collection: COLLECTION,
    blurb: 'Terminal-native journaling agent. Writes with you, not for you.',
    hint: hintFor('fieldnote')
  },
  'signal-garden': {
    slug: 'signal-garden',
    kicker: WALL_LABEL_KICKER,
    title: 'SIGNAL GARDEN',
    artist: ARTIST,
    year: 2024,
    medium: 'hardware, e-ink, ambient',
    dim: '6 dashboards, 4 offices',
    collection: COLLECTION,
    blurb: 'Ambient e-ink dashboards for distributed teams. Status without Slack.',
    hint: hintFor('signal-garden')
  },
  loom: {
    slug: 'loom',
    kicker: WALL_LABEL_KICKER,
    title: 'LOOM',
    artist: ARTIST,
    year: 2023,
    medium: 'web3, audio, mesh',
    dim: 'no servers, all rooms',
    collection: COLLECTION,
    blurb: 'Peer-to-peer music mesh. No servers, no ads, just rooms.',
    hint: hintFor('loom')
  }
};

export function getProjectMeta(slug: Slug): ProjectMeta {
  return PROJECTS[slug];
}
