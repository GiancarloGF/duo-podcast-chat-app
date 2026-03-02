export interface EpisodeWithProgressDto {
  id: string;
  slug: string;
  number: number;
  title: string;
  imageUrl: string;
  messageCount: number;
  summaryText: string;
  progressId: string | undefined;
  status: 'new' | 'started' | 'completed';
  displaySlot: 'previous' | 'current' | 'next';
  isAccessible: boolean;
  percentCompleted: number;
  lastActiveAt: Date | null;
  currentMessageIndex: number;
}
