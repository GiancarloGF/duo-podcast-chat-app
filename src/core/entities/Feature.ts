export interface Feature {
  id: string;
  title: string;
  description: string;
  route: string; // Internal route within the app, e.g., '/stories'
  imageUrl?: string;
  isEnabled: boolean;
}
