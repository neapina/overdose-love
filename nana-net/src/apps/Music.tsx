import { useEffect, useRef, useState } from 'react';
import { useGameState, type WindowState } from '../state/store';
import { REN_SONG, SONGS } from '../story/fs';
import { playMusic, stopMusic } from '../os/sounds';

export function Music({ win }: { win: WindowState }) {
  const s = useGameState();
  const tracks = [...SONGS, ...(s.flags.ren_song ? [REN_SONG] : [])];
  const wanted = win.props?.play as string | undefined;
  const [idx, setIdx] = useState(() => Math.max(0, tracks.findIndex((t) => t.title === wanted || `${t.title}` === wanted?.replace(/\.mp3$/, ''))));
  const [playing, setPlaying] = useState(!!wanted);
  const [pos, setPos] = useState(0);
  const idxRef = useRef(idx);
  idxRef.current = idx;
  const track = tracks[idx] ?? tracks[0];

  useEffect(() => {
    if (!playing) {
      stopMusic();
      return;
    }
    playMusic(idx + 1, track === REN_SONG);
    setPos(0);
    const t = setInterval(() => setPos((p) => (p + 1 >= track.len ? (setIdx((i) => (i + 1) % tracks.length), 0) : p + 1)), 1000);
    return () => {
      clearInterval(t);
      stopMusic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, idx]);

  useEffect(() => () => stopMusic(), []);

  useEffect(() => {
    if (wanted) {
      const i = tracks.findIndex((t) => t.title === wanted.replace(/\.mp3$/, ''));
      if (i >= 0) {
        setIdx(i);
        setPlaying(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted]);

  const fmt = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;

  return (
    <div className="music">
      <div className="music-now">
        <div className={`music-art ${playing ? 'playing' : ''}`} style={track === REN_SONG ? { background: 'radial-gradient(circle at 40% 35%, #4a5570, #1a1f2c 60%, #05070c)' } : undefined} />
        <div>
          <div style={{ fontSize: 15 }}>{track.title}</div>
          <div style={{ opacity: 0.7, fontSize: 12 }}>{track.artist}</div>
          {track === REN_SONG && <div style={{ opacity: 0.5, fontSize: 11, marginTop: 4 }}>прислал REN_17 · без названия</div>}
        </div>
      </div>
      <div className="music-list">
        {tracks.map((t, i) => (
          <div
            key={t.title}
            className={`clickable ${i === idx ? 'active' : ''}`}
            role="button"
            onDoubleClick={() => {
              setIdx(i);
              setPlaying(true);
            }}
          >
            <span>
              {i + 1}. {t.title} — {t.artist}
            </span>
            <span style={{ opacity: 0.6 }}>{fmt(t.len)}</span>
          </div>
        ))}
      </div>
      <div className="music-ctrl">
        <button onClick={() => setIdx((i) => (i - 1 + tracks.length) % tracks.length)}>⏮</button>
        <button onClick={() => setPlaying((p) => !p)}>{playing ? '❚❚' : '▶'}</button>
        <button onClick={() => setIdx((i) => (i + 1) % tracks.length)}>⏭</button>
        <div className="music-bar">
          <div style={{ width: `${(pos / track.len) * 100}%` }} />
        </div>
        <span style={{ fontSize: 11, opacity: 0.8 }}>
          {fmt(pos)} / {fmt(track.len)}
        </span>
      </div>
    </div>
  );
}
