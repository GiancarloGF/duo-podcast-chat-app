export interface PhrasalVerbGroupItem {
  number: number;
  title: string;
  items: string[];
}

export interface PhrasalVerbSuperGroup {
  id: string;
  title: string;
  color: string;
  lightColor: string;
  items: PhrasalVerbGroupItem[];
}
