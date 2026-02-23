'use client';

import { Component, type ReactNode } from 'react';
import { Button } from '@/shared/presentation/components/ui/button';

interface SessionErrorBoundaryProps {
  children: ReactNode;
}

interface SessionErrorBoundaryState {
  hasError: boolean;
}

export class SessionErrorBoundary extends Component<
  SessionErrorBoundaryProps,
  SessionErrorBoundaryState
> {
  constructor(props: SessionErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError(): SessionErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <section className='rounded-[10px] border-2 border-red-700 bg-red-100 p-6 shadow-[8px_8px_0_0_var(--color-border)]'>
        <h2 className='text-2xl font-black text-red-900'>Error en sesión</h2>
        <p className='mt-2 text-sm font-medium text-red-900'>
          Ocurrió un error inesperado durante la sesión de práctica.
        </p>
        <Button className='mt-4' onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </section>
    );
  }
}
