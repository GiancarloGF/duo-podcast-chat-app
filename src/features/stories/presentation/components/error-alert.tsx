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
    <div className='flex items-start gap-3 p-4 bg-[#ffe8e8] border-2 border-red-700 rounded-[8px] text-sm text-red-800 shadow-[4px_4px_0_0_#7f1d1d]'>
      <AlertCircle className='w-5 h-5 flex-shrink-0 mt-0.5' />
      <div className='flex-1'>
        <p className='font-semibold'>{message}</p>
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          onDismiss?.();
        }}
        className='flex-shrink-0 text-red-700 hover:text-red-900'
      >
        <X className='w-4 h-4' />
      </button>
    </div>
  );
}
