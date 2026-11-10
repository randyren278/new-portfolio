// Shared normalization and explicit plural forms keep accepted concepts consistent.
export function normalizeAnswer(input) {
  return String(input ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/^(?:a|an|the) /, '')
    .replace(/\s+/g, ' ');
}

const IRREGULAR_PLURALS = {
  mouse: 'mice',
  goose: 'geese',
  tooth: 'teeth',
  foot: 'feet',
  child: 'children',
  person: 'people',
  man: 'men',
  woman: 'women',
  ox: 'oxen',
  die: 'dice',
  knife: 'knives',
  leaf: 'leaves',
  wolf: 'wolves',
  calf: 'calves',
  loaf: 'loaves',
  shelf: 'shelves',
  scarf: 'scarves',
  hoof: 'hooves',
  half: 'halves',
  life: 'lives',
  wife: 'wives',
  self: 'selves',
  axis: 'axes',
  analysis: 'analyses',
  crisis: 'crises',
  thesis: 'theses',
  diagnosis: 'diagnoses',
  index: 'indices',
  matrix: 'matrices',
  vertex: 'vertices',
  phenomenon: 'phenomena',
  criterion: 'criteria',
  bookshelf: 'bookshelves',
  dormouse: 'dormice',
  fireman: 'firemen',
  policeman: 'policemen',
  policewoman: 'policewomen',
  chairman: 'chairmen',
  craftsman: 'craftsmen',
  potato: 'potatoes',
  tomato: 'tomatoes',
  hero: 'heroes',
  echo: 'echoes',
  domino: 'dominoes',
  torpedo: 'torpedoes',
  volcano: 'volcanoes',
  buffalo: 'buffaloes',
  mosquito: 'mosquitoes',
  quiz: 'quizzes',
  bacterium: 'bacteria',
  medium: 'media',
  cactus: 'cacti',
  fungus: 'fungi',
  octopus: 'octopi',
};

export function pluralForms(text) {
  const split = text.lastIndexOf(' ') + 1;
  const prefix = text.slice(0, split);
  const word = text.slice(split);
  const irregular = IRREGULAR_PLURALS[word];
  const regular = /[^aeiou]y$/.test(word)
    ? `${word.slice(0, -1)}ies`
    : /(?:s|x|z|ch|sh)$/.test(word)
      ? `${word}es`
      : `${word}s`;
  return [regular, ...(irregular ? [irregular] : [])].map((form) => prefix + form);
}

export function answerKey(question, value) {
  // The original normalizer remains available for recorded version-one answers.
  let text = value;
  if (question?.matchingVersion === 2)
    text = text.replace(
      /[æœøłđðþß]/giu,
      (letter) =>
        ({ æ: 'ae', œ: 'oe', ø: 'o', ł: 'l', đ: 'd', ð: 'd', þ: 'th', ß: 'ss' })[
          letter.toLowerCase()
        ],
    );
  if (question?.preciseMatching) text = text.replaceAll('♀', ' female').replaceAll('♂', ' male');
  return normalizeAnswer(text);
}
