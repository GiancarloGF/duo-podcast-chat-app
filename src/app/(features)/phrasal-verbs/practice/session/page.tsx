import { redirect } from 'next/navigation';

interface SessionAliasPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PhrasalVerbsPracticeSessionAliasPage({
  searchParams,
}: SessionAliasPageProps) {
  await searchParams;
  redirect('/phrasal-verbs/practice');
}
