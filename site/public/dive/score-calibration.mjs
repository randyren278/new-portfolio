import { answerKey } from './answer-matching.mjs';
import { SCORE_REVIEW } from './score-review.mjs';

export const EDITORIAL_POINTS = Object.freeze({
  common: 15, familiar: 30, uncommon: 45, rare: 65, deep: 85, exceptional: 100,
});
export const CONSERVATIVE_POINTS = 45;

// These relationships are explicit category membership, not a blanket union of
// animal/food prompts. E.g. nocturnal animals include birds and are not mammals.
const MEMBERSHIP = {
  'nature-mammals': [
    'nature-marine-mammals', 'nature-marsupials', 'nature-rodents', 'nature-primates',
    'nature-wild-cats', 'nature-wild-canids', 'nature-bears', 'nature-hoofed-mammals',
    'nature-dog-breeds',
  ],
  'nature-birds': ['nature-raptors', 'nature-seabirds', 'nature-flightless-birds'],
  'nature-reptiles': ['nature-snakes', 'nature-lizards'],
  'nature-fish': ['nature-sharks'],
  'nature-herbs': ['nature-leaf-herbs'],
  'play-nature-body-parts': ['nature-human-organs', 'nature-human-bones'],
};

const ADDITIONS = {
  'nature-mammals': [
    { name: 'aardvark' }, { name: 'tenrec' }, { name: 'solenodon' }, { name: 'fossa' },
  ],
  'play-culture-music-groups': [
    { name: 'brass quintet' }, { name: 'brass band' }, { name: 'wind quintet' },
    { name: 'string trio' }, { name: 'piano trio' }, { name: 'chamber orchestra' },
  ],
  'world-capitals': [{ name: 'Ngerulmud' }],
  'everyday-kitchen': [{ name: 'chinois' }],
  'everyday-clothes': [{ name: 'dirndl' }],
  'everyday-shoes': [{ name: 'babouche' }],
  'everyday-furniture': [{ name: 'secretaire', aliases: ['secretaire desk'] }],
  'everyday-ball-sports': [{ name: 'bossaball' }],
  'everyday-pasta': [{ name: 'culurgiones' }],
  'everyday-cheese': [{ name: 'mimolette' }, { name: 'pule' }],
  'everyday-bread': [{ name: 'rye bread', aliases: ['rye'] }],
  'everyday-stationery': [
    { name: 'protractor' }, { name: 'compass' }, { name: 'bone folder' },
    { name: 'ballpoint pen', aliases: ['ballpoint', 'biro'] },
    { name: 'marker', aliases: ['whiteboard marker', 'dry erase marker'] },
  ],
  'everyday-cooking': [{ name: 'spherification' }],
  'nature-marine-invertebrates': [{ name: 'clam' }, { name: 'nautilus' }],
  'nature-deciduous-trees': [{ name: 'cherry' }],
  'nature-desert-plants': [{ name: 'aloe' }],
  'nature-tree-parts': [{ name: 'seed' }, { name: 'fruit' }],
  'nature-animal-body-parts': [{ name: 'fur' }],
  'everyday-v5-baking-ingredients': [{ name: 'xanthan gum' }],
  'everyday-v5-condiments': [{ name: 'butter' }, { name: 'sambal oelek' }],
  'everyday-v5-pizza-toppings': [{ name: 'bell pepper', aliases: ['pepper'] }],
  'everyday-v5-snacks': [{ name: 'chocolate' }, { name: 'cookie' }],
  'everyday-v5-tableware': [{ name: 'teapot' }],
  'everyday-v5-bedroom': [{ name: 'valance' }, { name: 'book', aliases: ['books'] }],
  'everyday-v5-fasteners': [{ name: 'tape' }],
  'everyday-v5-computer-peripherals': [{ name: 'MIDI keyboard' }],
  'everyday-v5-bags': [{ name: 'reticule' }],
  'everyday-v5-jewelry': [{ name: 'chatelaine' }],
  'everyday-v5-school-subjects': [{ name: 'epistemology' }],
  'everyday-v5-fitness-exercises': [{ name: 'Jefferson curl' }],
  'everyday-v5-outdoor-activities': [{ name: 'coasteering' }],
  'everyday-v5-camping-gear': [
    { name: 'bivy sack', aliases: ['bivvy bag', 'bivvy sack', 'bivy bag'] },
  ],
  'everyday-v5-car-parts': [{ name: 'solenoid' }],
  'everyday-v5-sports-gear': [{ name: 'bobsled' }, { name: 'ski', aliases: ['skis'] }],
  'everyday-v5-emotions': [{ name: 'schadenfreude' }, { name: 'ennui' }],
  'everyday-v5-professions': [{ name: 'fletcher' }],
  'play-nature-pets': [{ name: 'sugar glider' }],
  'play-nature-body-parts': [{ name: 'uvula' }, { name: 'diaphragm' }],
  'play-culture-cartoon-animals': [{ name: 'Gromit' }, { name: 'Stuart Little' }],
  'play-culture-toys': [{ name: 'diabolo' }, { name: 'Jacob’s ladder' }],
  'nature-human-organs': [
    { name: 'thyroid', aliases: ['thyroid gland'] },
    { name: 'parathyroid', aliases: ['parathyroid gland', 'parathyroid glands'] },
  ],
  'play-nature-four-legged-animals': [{ name: 'tenrec' }, { name: 'solenodon' }, { name: 'fossa' }],
  'play-nature-african-animals': [{ name: 'tenrec' }, { name: 'fossa' }],
  'world-v5-canadian-cities': [
    { name: 'Lethbridge' }, { name: 'Grande Prairie' }, { name: 'Prince Albert' },
  ],
  'play-world-cities': [
    { name: 'Timbuktu' }, { name: 'Durban' }, { name: 'Lethbridge' },
    { name: 'Grande Prairie' }, { name: 'Prince Albert' },
  ],
};

function mergeEquivalentAnswers(question, entries) {
  const groups = entries.map((_, i) => i);
  const owner = new Map();
  const root = (i) => {
    while (groups[i] !== i) {
      groups[i] = groups[groups[i]];
      i = groups[i];
    }
    return i;
  };
  const join = (left, right) => { groups[root(right)] = root(left); };
  const names = entries.map((entry) => [entry.name, ...(entry.aliases ?? [])]);
  names.forEach((values, i) => values.forEach((value) => {
    const key = answerKey(question, value);
    if (owner.has(key)) join(owner.get(key), i);
    else owner.set(key, i);
  }));
  // Only shared, explicitly authored names and aliases establish identity.
  // A trailing s can distinguish cities, chemical symbols or music genres.
  const components = new Map();
  entries.forEach((entry, i) => {
    const key = root(i);
    if (!components.has(key)) components.set(key, []);
    components.get(key).push(entry);
  });
  return [...components.values()].map((component) => {
    const first = component[0];
    const aliases = [...new Set(component.flatMap((entry) => [entry.name, ...(entry.aliases ?? [])]))]
      .filter((name) => name !== first.name);
    return { name: first.name, ...(aliases.length ? { aliases } : {}) };
  });
}

export function reviewQuestionBank(previousBank) {
  const byId = new Map(previousBank.map((question) => [question.id, {
    ...question,
    answers: [...question.answers, ...(ADDITIONS[question.id] ?? [])],
  }]));
  return previousBank.map((question) => {
    const review = SCORE_REVIEW[question.id];
    if (!review) return question;
    const points = new Map();
    for (const [tier, value] of Object.entries(EDITORIAL_POINTS)) {
      for (const name of review[tier] ?? []) {
        const key = answerKey(question, name);
        points.set(key, Math.min(value, points.get(key) ?? Infinity));
      }
    }
    const entries = [
      ...question.answers,
      ...(ADDITIONS[question.id] ?? []),
      ...(MEMBERSHIP[question.id] ?? []).flatMap((id) => [
        ...(byId.get(id)?.answers ?? []), ...(ADDITIONS[id] ?? []),
      ]),
    ];
    const answers = mergeEquivalentAnswers(question, entries).map((answer) => {
      const reviewed = [answer.name, ...(answer.aliases ?? [])]
        .map((name) => points.get(answerKey(question, name))).filter((score) => score !== undefined);
      return {
        ...answer,
        score: reviewed.length ? Math.min(...reviewed) : CONSERVATIVE_POINTS,
        scoreBasis: reviewed.length ? 'reviewed' : 'conservative',
      };
    });
    return { ...question, answers, scoringVersion: 1 };
  });
}
