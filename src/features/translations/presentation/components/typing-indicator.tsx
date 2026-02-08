'use client';

export function TypingIndicator() {
  return (
    <div className='flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-3xl px-4 py-3 w-fit'>
      <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]'></div>
      <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]'></div>
      <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
    </div>
  );
}
