'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import Image from 'next/image';
import type { PhrasalVerb } from '@/features/phrasal-verbs/domain/entities/PhrasalVerb';
import { getSuperGroupColorsByTitle } from '@/features/phrasal-verbs/infrastructure/data/phrasalVerbGroups';
import { Button } from '@/shared/presentation/components/ui/button';
import { Badge } from '@/shared/presentation/components/ui/badge';

interface TheoryPhaseProps {
  phrasalVerbs: PhrasalVerb[];
  onComplete: () => void;
  isCompleting?: boolean;
}

export function TheoryPhase({ phrasalVerbs, onComplete, isCompleting = false }: TheoryPhaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  const currentPv = phrasalVerbs[currentIndex];
  const isLastCard = currentIndex >= phrasalVerbs.length - 1;
  const superGroupColors = useMemo(
    () => getSuperGroupColorsByTitle(currentPv?.superGroup ?? ''),
    [currentPv?.superGroup],
  );

  useEffect(() => {
    if (!currentPv?.imageUrl) {
      setImageStatus('error');
      return;
    }

    setImageStatus('loading');
  }, [currentPv?.id, currentPv?.imageUrl]);

  const progressPercent = useMemo(() => {
    if (phrasalVerbs.length === 0) {
      return 0;
    }

    return ((currentIndex + 1) / phrasalVerbs.length) * 100;
  }, [currentIndex, phrasalVerbs.length]);

  function handleNext(): void {
    if (isLastCard) {
      if (isCompleting) {
        return;
      }

      onComplete();
      return;
    }

    setDirection('left');
    setCurrentIndex((previous) => Math.min(previous + 1, phrasalVerbs.length - 1));
  }

  function handlePrevious(): void {
    if (currentIndex === 0) {
      return;
    }

    setDirection('right');
    setCurrentIndex((previous) => Math.max(previous - 1, 0));
  }

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo): void {
    const shouldSwipe = Math.abs(info.offset.x) > 90 || Math.abs(info.velocity.x) > 450;

    if (!shouldSwipe) {
      return;
    }

    if (info.offset.x > 0) {
      handlePrevious();
      return;
    }

    handleNext();
  }

  if (!currentPv) {
    return null;
  }

  return (
    <section className='rounded-[10px] border-2 border-border bg-card p-4 sm:p-6 shadow-[8px_8px_0_0_var(--color-border)]'>
      <div className='mb-4'>
        <div className='mb-1 flex items-center justify-between text-xs font-black uppercase text-muted-foreground'>
          <span>Phase 1: Theory</span>
          <span>
            {currentIndex + 1} / {phrasalVerbs.length}
          </span>
        </div>
        <div className='h-3 overflow-hidden rounded-[6px] border-2 border-border bg-muted'>
          <div
            className='h-full bg-primary transition-all duration-300'
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className='mx-auto'>
        <AnimatePresence mode='wait' custom={direction}>
          <motion.div
            key={currentPv.id}
            initial={{
              x: direction === 'left' ? 240 : -240,
              opacity: 0,
            }}
            animate={{
              x: 0,
              opacity: 1,
            }}
            exit={{
              x: direction === 'left' ? -240 : 240,
              opacity: 0,
            }}
            transition={{ type: 'spring', stiffness: 250, damping: 24 }}
            drag='x'
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            className='mx-auto w-full max-w-4xl overflow-hidden rounded-[10px] border-2 border-border bg-card text-left shadow-[6px_6px_0_0_var(--color-border)]'
            style={{ backgroundColor: superGroupColors?.lightColor ?? undefined }}
          >
            <div className='p-4 sm:p-6'>
              <div className='relative'>
                {currentPv.imageUrl ? (
                  <Image
                    src={currentPv.imageUrl}
                    alt={currentPv.phrasalVerb}
                    width={1200}
                    height={675}
                    sizes='100vw'
                    className='h-auto w-full object-contain'
                    onLoad={() => setImageStatus('loaded')}
                    onError={() => setImageStatus('error')}
                  />
                ) : null} 

                 {imageStatus !== 'loaded' ? ( 
                  <div className='absolute inset-0 flex flex-col justify-between rounded-[10px] border-2 border-border bg-card/95 p-3 sm:p-4'>
                    <p className=' font-bold leading-snug text-foreground text-xl sm:text-4xl italic text-center'>
                      {currentPv.example}
                    </p>
                    <div className='mt-3'>
                      <p className='text-2xl font-black leading-tight text-foreground sm:text-4xl'>
                        {currentPv.phrasalVerb}
                      </p>
                      <p className='mt-2 text-base italic font-semibold leading-snug text-muted-foreground sm:text-2xl'>
                        {currentPv.definition}
                      </p>
                    </div>
                  </div>
                 ) : null} 
              </div>
            </div>

            <div className='p-4 sm:p-6'>

              <div className='mt-4'>
                <div className='mt-2 flex flex-wrap gap-2'>
                  <Badge
                    className='shrink-0 border-2 border-border text-xs font-black uppercase tracking-wide text-white'
                    style={{ backgroundColor: superGroupColors?.color ?? undefined }}
                  >
                    {currentPv.superGroup}
                  </Badge>
                  <Badge className='shrink-0 border-2 border-border bg-background/95 text-foreground'>
                    {currentPv.group}
                  </Badge>
                  <Badge className='shrink-0 border-2 border-border bg-background/95 text-foreground'>
                    {currentPv.category}
                  </Badge>
                  <div className="w-4"></div>
                  <Badge className='shrink-0 border-2 border-border bg-background/95 text-foreground'>
                    {currentPv.transitivity}
                  </Badge>
                  <Badge className='shrink-0 border-2 border-border bg-background/95 text-foreground'>
                    {currentPv.separability}
                  </Badge>
                </div>
              </div>

              {currentPv.commonUsage ? (
                <div className='mt-4'>
                  <p className='text-sm font-black uppercase text-secondary-foreground/70'>Common usage</p>
                  <p className='text-base font-medium text-secondary-foreground sm:text-lg'>{currentPv.commonUsage}</p>
                </div>
              ) : null}

              {currentPv.synonyms.length > 0 ? (
                <div className='mt-4'>
                  <p className='text-sm font-black uppercase text-secondary-foreground/70'>Synonyms</p>
                  <div className='mt-2 flex flex-wrap gap-2'>
                    {currentPv.synonyms.map((synonym) => (
                      <span
                        key={synonym}
                        className='rounded-[6px] border-2 border-border bg-card px-2 py-1 text-sm font-semibold text-foreground'
                      >
                        {synonym}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {currentPv.nativeNotes.length > 0 ? (
                <div className='mt-4'>
                  <p className='text-sm font-black uppercase text-secondary-foreground/70'>Native notes</p>
                  <ul className='mt-2 list-disc space-y-1 pl-5 text-base font-medium text-secondary-foreground sm:text-lg'>
                    {currentPv.nativeNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className='mt-5 flex flex-wrap items-center justify-center gap-3'>
        <Button variant='outline' onClick={handlePrevious} disabled={currentIndex === 0}>
          Previous
        </Button>
        <Button onClick={handleNext} disabled={isCompleting}>
          {isLastCard ? (isCompleting ? 'Preparing practice...' : 'Start practice') : 'Next'}
        </Button>
      </div>

      <p className='mt-3 text-center text-xs font-medium text-muted-foreground'>
        You can also swipe the card left and right to navigate through the phrasal verbs.
      </p>
    </section>
  );
}
