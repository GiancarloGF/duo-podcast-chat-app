import type { Metadata } from 'next';

interface CreateFeatureMetadataParams {
  title: string;
  description: string;
  path: string;
}

// Centralize per-feature metadata so route segments stay consistent for title,
// canonical URLs, Open Graph, and Twitter cards.
export function createFeatureMetadata(
  params: CreateFeatureMetadataParams,
): Metadata {
  const baseTitle = 'Ruway App';
  const canonicalPath = params.path.startsWith('/') ? params.path : `/${params.path}`;

  return {
    title: `${params.title} | ${baseTitle}`,
    description: params.description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${params.title} | ${baseTitle}`,
      description: params.description,
      type: 'website',
      locale: 'es_CO',
      url: canonicalPath,
      siteName: baseTitle,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${params.title} | ${baseTitle}`,
      description: params.description,
    },
  };
}
