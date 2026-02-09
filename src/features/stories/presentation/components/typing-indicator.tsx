'use client';

export function TypingIndicator() {
  return (
    <div className='flex items-center space-x-1 bg-secondary rounded-[8px] border-2 border-border px-4 py-3 w-fit shadow-[4px_4px_0_0_var(--color-border)]'>
      <div className='w-2 h-2 bg-foreground rounded-[2px] animate-bounce [animation-delay:-0.3s]'></div>
      <div className='w-2 h-2 bg-foreground rounded-[2px] animate-bounce [animation-delay:-0.15s]'></div>
      <div className='w-2 h-2 bg-foreground rounded-[2px] animate-bounce'></div>
    </div>
  );
}
