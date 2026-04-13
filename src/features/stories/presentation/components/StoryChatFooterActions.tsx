'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/shared/presentation/components/ui/button';
import { useStoryChatSessionContext } from '@/features/stories/presentation/components/StoryChatSessionProvider';

export function StoryChatFooterActions() {
  const router = useRouter();
  const { canInteract, episodeComplete, handleNext, isProcessing } =
    useStoryChatSessionContext();

  if (episodeComplete) {
    return (
      <Button onClick={() => router.push('/stories')} className='min-w-36 sm:text-lg'>
        Volver
      </Button>
    );
  }

  return (
    <Button
      onClick={() => void handleNext()}
      disabled={isProcessing || !canInteract}
      className='min-w-36 sm:text-lg'
    >
      Continuar
    </Button>
  );
}
