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
            {t.action && <small>нажми, чтобы открыть</small>}
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

/** Nana's inner voice, bottom-left */
export function Thought() {
  const thought = useGame((s) => s.thought);
  if (!thought) return null;
  return (
    <div className="thought" key={thought.id}>
      {thought.text}
    </div>
  );
}
