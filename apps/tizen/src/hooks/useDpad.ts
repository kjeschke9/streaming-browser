import { useEffect, useCallback, useRef } from 'react';

export type DpadDirection = 'up' | 'down' | 'left' | 'right' | 'enter' | 'back';

interface DpadOptions {
  onUp?:    () => void;
  onDown?:  () => void;
  onLeft?:  () => void;
  onRight?: () => void;
  onEnter?: () => void;
  onBack?:  () => void;
  enabled?: boolean;
}

const KEY_MAP: Record<string, DpadDirection> = {
  ArrowUp:    'up',    38: 'up' as any,
  ArrowDown:  'down',  40: 'down' as any,
  ArrowLeft:  'left',  37: 'left' as any,
  ArrowRight: 'right', 39: 'right' as any,
  Enter:      'enter', 13: 'enter' as any,
  Escape:     'back',  461: 'back' as any,  // Tizen back key
  GoBack:     'back',
};

export function useDpad({ onUp, onDown, onLeft, onRight, onEnter, onBack, enabled = true }: DpadOptions) {
  const handlers = useRef({ onUp, onDown, onLeft, onRight, onEnter, onBack });
  handlers.current = { onUp, onDown, onLeft, onRight, onEnter, onBack };

  useEffect(() => {
    if (!enabled) return;
    const handleKey = (e: KeyboardEvent) => {
      const dir = KEY_MAP[e.key] ?? KEY_MAP[e.keyCode];
      if (!dir) return;
      e.preventDefault();
      switch (dir) {
        case 'up':    handlers.current.onUp?.();    break;
        case 'down':  handlers.current.onDown?.();  break;
        case 'left':  handlers.current.onLeft?.();  break;
        case 'right': handlers.current.onRight?.(); break;
        case 'enter': handlers.current.onEnter?.(); break;
        case 'back':  handlers.current.onBack?.();  break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [enabled]);
}

// ─── Spatial navigation grid helper ──────────────────────────────────────────
export function useFocusGrid(
  items: string[],   // focusable item IDs in row-major order
  cols: number,
  onSelect: (id: string) => void,
  onBack?: () => void
) {
  const indexRef = useRef(0);
  const setFocusIndex = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, next));
    indexRef.current = clamped;
    const el = document.getElementById(items[clamped] ?? '');
    el?.focus();
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [items]);

  useDpad({
    onUp:    () => setFocusIndex(indexRef.current - cols),
    onDown:  () => setFocusIndex(indexRef.current + cols),
    onLeft:  () => setFocusIndex(indexRef.current - 1),
    onRight: () => setFocusIndex(indexRef.current + 1),
    onEnter: () => {
      const id = items[indexRef.current];
      if (id) onSelect(id);
    },
    onBack,
  });

  return { focusFirst: () => setFocusIndex(0), currentIndex: indexRef };
}
