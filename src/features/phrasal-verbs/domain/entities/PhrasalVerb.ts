export interface PhrasalVerb {
  id: string;
  phrasalVerb: string;
  verb: string;
  particles: string[];
  superGroup: string;
  group: string;
  category: string;
  meaning: string;
  definition: string;
  example: string;
  commonUsage: string;
  transitivity: string;
  separability: string;
  imageUrl: string;
  synonyms: string[];
  nativeNotes: string[];
  createdAt: Date | null;
}
