import type { PhrasalVerbSuperGroup } from '@/features/phrasal-verbs/domain/entities/PhrasalVerbGroup';

export const PHRASAL_VERB_GROUPS: PhrasalVerbSuperGroup[] = [
  {
    id: 'describing_people_and_things',
    title: 'Describing people and things',
    color: '#8ac14c',
    lightColor: '#fafbf6',
    items: [
      {
        number: 1,
        title: 'People and things',
        items: ['people', 'things'],
      },
      { number: 2, title: 'Family', items: ['family', 'pets'] },
      {
        number: 3,
        title: 'Relationships',
        items: ['friendships', 'romantic relationships'],
      },
      {
        number: 4,
        title: 'Visiting people',
        items: ['visiting people', 'a party invitation'],
      },
      {
        number: 5,
        title: 'Socializing',
        items: ['socializing', 'leaving'],
      },
      {
        number: 6,
        title: 'Clothing',
        items: ['clothing', 'accessories'],
      },
      {
        number: 7,
        title: 'Before and after',
        items: ['cause and effect', 'making comparisons'],
      },
    ],
  },
  {
    id: 'everyday_life',
    title: 'Everyday life',
    color: '#955a9e',
    lightColor: '#faf5fb',
    items: [
      {
        number: 8,
        title: 'Everyday life',
        items: ['daily routine', 'sleeping', 'relaxing', 'tasks'],
      },
      {
        number: 9,
        title: 'Transportation',
        items: ['vehicles', 'driving'],
      },
      { number: 10, title: 'Shopping', items: ['shopping'] },
      { number: 11, title: 'The weather', items: ['weather'] },
      {
        number: 12,
        title: 'Technology',
        items: ['computer systems', 'new products', 'using technology'],
      },
      {
        number: 13,
        title: 'Crime, the law, and politics',
        items: ['crime and the law', 'politics'],
      },
      { number: 14, title: 'Money', items: ['money'] },
      { number: 15, title: 'Time', items: ['time', 'waiting'] },
      {
        number: 16,
        title: 'Past and future',
        items: ['future', 'memory', 'change and rescheduling'],
      },
      {
        number: 17,
        title: 'Making plans',
        items: ['making plans', 'canceling plans'],
      },
      {
        number: 18,
        title: 'The senses',
        items: ['hearing', 'smell and taste', 'sight'],
      },
      {
        number: 19,
        title: 'Movement and progress',
        items: ['movement and progress', 'walking'],
      },
    ],
  },
  {
    id: 'work_and_school',
    title: 'Work and school',
    color: '#f49537',
    lightColor: '#fef9f5',
    items: [
      {
        number: 20,
        title: 'Studying and research',
        items: ['studying and research', 'making a presentation'],
      },
      {
        number: 21,
        title: 'At school',
        items: ['school', 'bad behavior'],
      },
      {
        number: 22,
        title: 'At work',
        items: ['starting and finishing', 'meetings', 'working'],
      },
      { number: 23, title: 'Careers', items: ['careers'] },
      { number: 24, title: 'Business', items: ['business'] },
      {
        number: 25,
        title: 'Numbers and amounts',
        items: ['numbers and amounts', 'calculations'],
      },
      {
        number: 26,
        title: 'Success and failure',
        items: ['success', 'failure', 'causes of success and failure'],
      },
    ],
  },
  {
    id: 'home_and_free_time',
    title: 'Home and free time',
    color: '#00a58d',
    lightColor: '#f5f9f8',
    items: [
      {
        number: 27,
        title: 'At home',
        items: ['about lock', 'appliances and household items', 'moving'],
      },
      {
        number: 28,
        title: 'Chores',
        items: ['cleaning', 'gardening'],
      },
      {
        number: 29,
        title: 'Cooking',
        items: ['cooking', 'preparing a recipe'],
      },
      {
        number: 30,
        title: 'Food and drink',
        items: ['food', 'drink'],
      },
      {
        number: 31,
        title: 'Free time',
        items: ['hobbies', 'relaxing'],
      },
      { number: 32, title: 'Health', items: ['health'] },
      {
        number: 33,
        title: 'Sports and exercise',
        items: ['sports', 'exercise'],
      },
      {
        number: 34,
        title: 'The arts',
        items: ['creativity', 'media', 'music'],
      },
      { number: 35, title: 'Travel', items: ['travel'] },
    ],
  },
  {
    id: 'communication',
    title: 'Communication',
    color: '#ea4e38',
    lightColor: '#fcf7f3',
    items: [
      { number: 36, title: 'Talking', items: ['talking'] },
      {
        number: 37,
        title: 'Reading and writing',
        items: ['reading', 'writing'],
      },
      {
        number: 38,
        title: 'Keeping in touch',
        items: ['on the phone', 'leaving a message', 'sending and replying'],
      },
      {
        number: 39,
        title: 'Thoughts and ideas',
        items: ['realizing things', 'ideas', 'thoughts'],
      },
      {
        number: 40,
        title: 'Explaining things',
        items: ['explaining things'],
      },
      {
        number: 41,
        title: 'Truth and lies',
        items: ['truth', 'lies'],
      },
      {
        number: 42,
        title: 'Encouragement',
        items: ['encouragement and persuasion'],
      },
    ],
  },
  {
    id: 'emotions_and_situations',
    title: 'Emotions and situations',
    color: '#0491cd',
    lightColor: '#f4f8fb',
    items: [
      {
        number: 43,
        title: 'Agreeing and disagreeing',
        items: ['agreeing and disagreeing', 'avoiding conflict'],
      },
      {
        number: 44,
        title: 'Opinions and arguments',
        items: [
          'offering opinions',
          'joining arguments',
          'surrendering, compromise and reconciliation',
        ],
      },
      {
        number: 45,
        title: 'Emotions',
        items: ['positive emotions', 'dealing with emotions'],
      },
      {
        number: 46,
        title: 'Negative emotions',
        items: ['negative emotions'],
      },
      {
        number: 47,
        title: 'Making decisions',
        items: ['making decisions'],
      },
      {
        number: 48,
        title: 'Making mistakes',
        items: ['making mistakes'],
      },
      {
        number: 49,
        title: 'Accidents and damage',
        items: ['accidents', 'about falling', 'damage'],
      },
      {
        number: 50,
        title: 'Problems and solutions',
        items: ['problems and solutions'],
      },
      {
        number: 51,
        title: 'Secrets and surprises',
        items: ['secrets', 'surprises'],
      },
    ],
  },
  {
    id: 'common_verbs',
    title: 'Common verbs',
    color: '#8ac14c',
    lightColor: '#fafbf6',
    items: [
      {
        number: 52,
        title: 'Come, make, and do',
        items: ["with 'do'", "with 'make'", "with 'come'"],
      },
      {
        number: 53,
        title: 'Get and set',
        items: ["with 'get'", "with 'set'"],
      },
      { number: 54, title: 'Go', items: ["with 'go'"] },
      {
        number: 55,
        title: 'Put, take, and give',
        items: ["with 'put'", "with 'take'", "with 'give'"],
      },
      { number: 56, title: 'Exclamations', items: ['exclamations'] },
    ],
  },
];

export const GROUPS_COLORS_MAP: Record<
  string,
  { color: string; lightColor: string }
> = PHRASAL_VERB_GROUPS.reduce(
  (acc, group) => {
    acc[group.id] = { color: group.color, lightColor: group.lightColor };
    return acc;
  },
  {} as Record<string, { color: string; lightColor: string }>,
);

export function normalizeSuperGroupKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const GROUPS_COLORS_BY_TITLE_MAP: Record<string, { color: string; lightColor: string }> =
  PHRASAL_VERB_GROUPS.reduce(
    (acc, group) => {
      acc[normalizeSuperGroupKey(group.title)] = {
        color: group.color,
        lightColor: group.lightColor,
      };
      return acc;
    },
    {} as Record<string, { color: string; lightColor: string }>
  );

export function getSuperGroupColorsByTitle(
  superGroupTitle: string
): { color: string; lightColor: string } | null {
  const normalizedKey = normalizeSuperGroupKey(superGroupTitle);

  if (!normalizedKey) {
    return null;
  }

  return GROUPS_COLORS_MAP[normalizedKey] ?? GROUPS_COLORS_BY_TITLE_MAP[normalizedKey] ?? null;
}
