import { Story } from '../entities/Story';

export interface IStoryRepository {
  getStories(): Promise<Story[]>;
  getStoryById(id: string): Promise<Story | null>;
  // Add more methods as needed, e.g., getStoryBySlug
}
