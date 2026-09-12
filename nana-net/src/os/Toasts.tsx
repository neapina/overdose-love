import { useEffect, useState } from 'react';
import { dismissToast, useGame } from '../state/store';
import { openWindow } from '../state/windows';
import { playSound } from './sounds';

export function Toasts() {
  const toasts = useGame((s) => s.toasts);
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast ${t.action ? 'clickable actionable' : ''}`}
          role={t.action ? 'button' : undefined}
          title={t.action ? 'Открыть' : undefined}
          onClick={() => {
            if (!t.action) return;
            playSound('click');
            openWindow(t.action.app, t.action.props);
            dismissToast(t.id);
          }}
        >
          <img src={t.icon ?? '/assets/mm/notif-bell.png'} alt="" />
          <div>
            <b>{t.title}</b>
            <span>{t.text}</span>
            {t.action && <small>открыть →</small>}
          </div>
          <button
            className="toast-x"
            aria-label="Закрыть"
            onClick={(e) => {
              e.stopPropagation();
              dismissToast(t.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

/** Nana's inner voice — typed out like a subtitle at the bottom of the screen */
export function Thought() {
  const thought = useGame((s) => s.thought);
  if (!thought) return null;
  return <TypedThought key={thought.id} text={thought.text} ms={thought.ms} />;
}

function TypedThought({ text, ms }: { text: string; ms: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= text.length) return;
    const ch = text[n];
    const t = setTimeout(() => setN((k) => k + 1), ch === '.' || ch === '…' ? 160 : ch === ',' ? 90 : 22);
    return () => clearTimeout(t);
  }, [n, text]);
  return (
    <div className="thought" style={{ animationDelay: `0s, ${Math.max(0, ms - 1000) / 1000}s` }}>
      {text.slice(0, n)}
      {n < text.length && <span className="caret" />}
    </div>
  );
}
