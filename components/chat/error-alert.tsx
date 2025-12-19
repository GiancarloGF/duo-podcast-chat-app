'use client';

import { AlertCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ErrorAlertProps {
  message: string | null;
  onDismiss?: () => void;
  autoDismiss?: boolean;
  dismissAfter?: number;
}

export function ErrorAlert({
  message,
  onDismiss,
  autoDismiss = true,
  dismissAfter = 5000,
}: ErrorAlertProps) {
  const [isVisible, setIsVisible] = useState(!!message);

  useEffect(() => {
    setIsVisible(!!message);

    if (autoDismiss && message) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, dismissAfter);

      return () => clearTimeout(timer);
    }
  }, [message, autoDismiss, dismissAfter, onDismiss]);

  if (!isVisible || !message) return null;

  return (
    <div className='flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300'>
      <AlertCircle className='w-5 h-5 flex-shrink-0 mt-0.5' />
      <div className='flex-1'>
        <p>{message}</p>
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          onDismiss?.();
        }}
        className='flex-shrink-0 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200'
      >
        <X className='w-4 h-4' />
      </button>
    </div>
  );
}
