import { useGame } from '../state/store';

export function Toasts() {
  const toasts = useGame((s) => s.toasts);
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <img src={t.icon ?? '/assets/mm/notif-bell.png'} alt="" />
          <div>
            <b>{t.title}</b>
            <span>{t.text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
