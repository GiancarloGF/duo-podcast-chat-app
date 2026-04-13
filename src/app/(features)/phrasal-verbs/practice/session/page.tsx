import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createFeatureMetadata } from '@/shared/presentation/metadata/featureMetadata';

export const metadata: Metadata = createFeatureMetadata({
  title: 'Practice Setup',
  description: 'Redirección de compatibilidad hacia la experiencia actual de práctica.',
  path: '/phrasal-verbs/practice/session',
});

interface SessionAliasPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Preserve the old URL as a compatibility alias so existing bookmarks and links
// still land in the current practice experience.
export default async function PhrasalVerbsPracticeSessionAliasPage({
  searchParams,
}: SessionAliasPageProps) {
  await searchParams;
  redirect('/phrasal-verbs/practice');
}
