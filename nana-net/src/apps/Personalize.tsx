import { resetGame, setState, useGameState } from '../state/store';
import { playSound } from '../os/sounds';

const WALLPAPERS: { id: 'day' | 'dusk' | 'night'; name: string; style: React.CSSProperties }[] = [
  { id: 'day', name: 'Утро (по умолчанию)', style: { background: 'linear-gradient(180deg,#a9d3f5,#e9d5e2)' } },
  { id: 'dusk', name: 'Город, вечер', style: { backgroundImage: 'url(/assets/wallpaper-dusk.jpg)' } },
  { id: 'night', name: 'Город, ночь', style: { backgroundImage: 'url(/assets/wallpaper-night.jpg)' } },
];

export function Personalize() {
  const s = useGameState();
  return (
    <div className="personalize">
      <h3 style={{ margin: '0 0 10px', fontWeight: 400, color: '#1c3b5e' }}>Изменение изображения и звука на компьютере</h3>
      <p style={{ fontSize: 12, color: '#556' }}>Фон рабочего стола</p>
      <div className="wp-grid">
        {WALLPAPERS.map((w) => (
          <div
            key={w.id}
            className={`wp-opt clickable ${s.wallpaper === w.id ? 'active' : ''}`}
            role="button"
            title={w.name}
            style={w.style}
            onClick={() => {
              playSound('click');
              setState({ wallpaper: w.id });
            }}
          />
        ))}
      </div>
      <p style={{ fontSize: 12, color: '#556', marginTop: 18 }}>Экран</p>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5 }}>
        <input type="checkbox" checked={s.effects} onChange={(e) => setState({ effects: e.target.checked })} />
        Эффекты монитора (зерно, развёртка, виньетка)
      </label>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5, marginTop: 6 }}>
        <input type="checkbox" checked={!s.muted} onChange={(e) => setState({ muted: !e.target.checked })} />
        Системные звуки
      </label>
      <p style={{ fontSize: 12, color: '#556', marginTop: 18 }}>Учётная запись</p>
      <div style={{ fontSize: 12.5 }}>
        nana · день {s.day} · ren {s.ren} / mayu {s.mayu}
      </div>
      <button
        className="btn"
        style={{ marginTop: 10 }}
        onClick={() => {
          if (confirm('Стереть сохранение и начать с первого дня?')) {
            resetGame();
          }
        }}
      >
        Сбросить игру…
      </button>
    </div>
  );
}
