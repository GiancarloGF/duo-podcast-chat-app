export interface EpisodeWithProgressDto {
  id: string;
  slug: string;
  title: string;
  imageUrl: string;
  messageCount: number;
  summaryText: string;
  progressId: string | undefined;
  status: 'new' | 'started' | 'completed';
  percentCompleted: number;
  lastActiveAt: Date | null;
  currentMessageIndex: number;
}
