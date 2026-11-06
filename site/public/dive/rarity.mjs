export const RARITY_BANDS = Object.freeze(
  [
    {
      id: 'plankton',
      label: 'Plankton',
      min: 1,
      max: 19,
      color: '#a5bad5',
      message: 'A familiar catch. There’s a whole ocean beneath it.',
      notes: [330, 440],
    },
    {
      id: 'tooclever',
      label: 'Too Clever',
      min: 20,
      max: 34,
      color: '#ffb264',
      message: 'A clever turn. There’s still deeper water.',
      notes: [440, 370, 494],
    },
    {
      id: 'schooler',
      label: 'Schooler',
      min: 35,
      max: 54,
      color: '#69e6f2',
      message: 'A good catch, travelling with the current.',
      notes: [392, 523, 659],
    },
    {
      id: 'rare',
      label: 'Rare',
      min: 55,
      max: 74,
      color: '#ff8ea6',
      message: 'An unusual find, well below the everyday.',
      notes: [523, 659, 784],
    },
    {
      id: 'deepcut',
      label: 'Deep Cut',
      min: 75,
      max: 94,
      color: '#b59aff',
      message: 'That one came from somewhere deep.',
      notes: [587, 740, 880],
    },
    {
      id: 'krillion',
      label: 'One in a Krillion',
      min: 95,
      max: 100,
      color: '#ffda83',
      message: 'A tiny treasure from the bottom of the ocean.',
      notes: [659, 831, 988, 1318],
    },
  ].map((band, rank) => Object.freeze({ ...band, rank })),
);

export function rarityFor(score) {
  if (!Number.isFinite(score) || score < 1 || score > 100) return null;
  return RARITY_BANDS.find((band) => score <= band.max);
}

export function diveRarityFor(score) {
  const rank = score >= 450 ? 5 : score >= 351 ? 4 : score >= 251 ? 3 : score >= 151 ? 2 : 0;
  return RARITY_BANDS[rank];
}

// Original pixel drawings; the reference game's image assets are not used here.
const shapes = {
  plankton:
    '<path fill-rule="evenodd" d="M5 2h6v2h2v6h-2v2H5v-2H3V4h2zm0 3v4h6V5zM16 12h4v2h2v4h-2v2h-4v-2h-2v-4h2zm0 3v2h4v-2zM5 17h3v2h2v3H5v-2H3v-3z"/>',
  tooclever:
    '<path d="M4 8V3h5l3 5 3-5h5v5h-3v3H7V8zM5 11h14v7h-3v3H8v-3H5z"/><path fill="#f4ead5" d="M7 11h10v7H7z"/><path fill="#15304c" d="M8 12h2v2H8zm6 0h2v2h-2zM9 17h6v2H9z"/><path d="M11 14h3v3h-3z"/>',
  schooler:
    '<path d="M1 9h3V7h5V5h7v2h4v2h3v5h-3v2h-4v2H9v-2H4v-2H1z"/><path fill="#e8fbff" d="M8 8h8v2H8z"/><path fill="#10243d" d="M17 10h2v2h-2z"/><path opacity=".6" d="M3 1h5v2H3zM6 21h7v2H6z"/>',
  rare: '<path d="M8 2h8v2h3v3h2v7h-3v3h2v5h-3v-5h-3v4h-3v-4H8v5H5v-5H3v-3H2V7h3V4h3z"/><path fill="#ffdbe5" d="M8 5h7v2H8z"/><path fill="#173049" d="M6 10h3v3H6zm9 0h3v3h-3z"/>',
  deepcut:
    '<path d="M9 1h6v2h3v4h3v3h-3v9h3v3H3v-3h3v-9H3V7h3V3h3z"/><path fill="#ffe4a7" d="M9 10h6v8H9z"/><path fill="#1a2b50" d="M9 4h6v3H9z"/><path fill="#fff6d8" d="M10 11h2v5h-2z"/>',
  krillion:
    '<path d="M10 0h4v5h3v3h7v5h-5v3h-3v8h-5v-6H8v-3H1v-5h6V7h3z"/><path fill="#fff5d1" d="M10 8h5v6h-5z"/><path opacity=".6" d="M1 1h3v3H1zm19 19h3v3h-3z"/>',
  miss: '<path d="M5 2h5v2H5zM2 5h2v5H2zm0 9h2v5H2zm3 6h5v2H5zm9 0h5v2h-5zm6-6h2v5h-2zm0-9h2v5h-2zm-6-3h5v2h-5z"/>',
};
export function rarityIcon(id) {
  return `<svg class="rarity-icon" viewBox="0 0 24 24" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true">${shapes[id] ?? shapes.miss}</svg>`;
}

export function rarityLadder(current) {
  return `<div class="rarity-ladder" aria-hidden="true">${RARITY_BANDS.map((band) => `<span class="rarity-step ${band.rank === current.rank ? 'current' : ''} ${band.rank < current.rank ? 'reached' : ''}" style="--step-color:${band.color}" title="${band.label}">${rarityIcon(band.id)}</span>`).join('')}</div>`;
}
