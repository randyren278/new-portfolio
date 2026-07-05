export const ORDER = ['oryzo', 'halcyon', 'paperlane', 'atlas', 'koinu', 'linen'] as const;
export type Slug = (typeof ORDER)[number];

export type ProjectMeta = {
  slug: Slug;
  kicker: string;
  title: string;
  year: string;
  role: string;
  stack: string;
  blurb: string;
  hint: string;
};

export const PROJECTS: Record<Slug, ProjectMeta> = {
  oryzo: {
    slug: 'oryzo',
    kicker: 'plate 01 · oryzo',
    title: 'a paced rice cooker for one.',
    year: '2025',
    role: 'design + firmware',
    stack: 'esp32, react native, custom pcb',
    blurb: 'a small appliance that measures rice by weight, not cups. the interface is a single dial and a hairline gauge.',
    hint: 'open oryzo for the long plate.'
  },
  halcyon: {
    slug: 'halcyon',
    kicker: 'plate 02 · halcyon',
    title: 'a quiet client for a loud protocol.',
    year: '2024',
    role: 'design + engineering',
    stack: 'swiftui, matrix protocol',
    blurb: 'a matrix client shaped like a notebook. rooms are tabs, messages are marginalia.',
    hint: 'open halcyon for the long plate.'
  },
  paperlane: {
    slug: 'paperlane',
    kicker: 'plate 03 · paperlane',
    title: 'a newsletter that respects the reader.',
    year: '2024',
    role: 'product + typography',
    stack: 'nextjs, postgres, resend',
    blurb: 'a newsletter platform with typography as the first-class primitive. no dashboards, no funnels.',
    hint: 'open paperlane for the long plate.'
  },
  atlas: {
    slug: 'atlas',
    kicker: 'plate 04 · atlas',
    title: 'a cartography tool for hand-drawn maps.',
    year: '2023',
    role: 'creative technology',
    stack: 'canvas, wasm, rust',
    blurb: 'a browser tool that turns pen strokes into contour lines. built for one specific cartographer.',
    hint: 'open atlas for the long plate.'
  },
  koinu: {
    slug: 'koinu',
    kicker: 'plate 05 · koinu',
    title: 'a walk tracker with a memory.',
    year: '2023',
    role: 'design + ios',
    stack: 'swiftui, core location',
    blurb: 'a walk tracker that remembers routes as small drawings, not heatmaps. named after a friend’s dog.',
    hint: 'open koinu for the long plate.'
  },
  linen: {
    slug: 'linen',
    kicker: 'plate 06 · linen',
    title: 'a wardrobe planner that reads the sky.',
    year: '2022',
    role: 'design + ios',
    stack: 'swift, weatherkit',
    blurb: 'a small ios app that lays out an outfit based on tomorrow’s forecast, then forgets it once you dress.',
    hint: 'open linen for the long plate.'
  }
};

export function getProjectMeta(slug: Slug): ProjectMeta {
  return PROJECTS[slug];
}
