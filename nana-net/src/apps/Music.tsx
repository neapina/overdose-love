import { useEffect, useRef, useState } from 'react';
import { setState, stage, think, useGameState, type WindowState } from '../state/store';
import { REN_SONG, SONGS } from '../story/fs';
import { playMusic, playSound, setMusicMuted, stopMusic } from '../os/sounds';
import { openOn, TOUCH } from '../os/viewport';

const byName = (name: string | undefined, list: typeof SONGS) => (name ? list.findIndex((t) => t.title === name.replace(/\.mp3$/, '') || t.title === name) : -1);

export function Music({ win }: { win: WindowState }) {
  const s = useGameState();
  const tracks = [...SONGS, ...(s.flags.ren_song ? [REN_SONG] : [])];
  const wanted = win.props?.play as string | undefined;
  const [idx, setIdx] = useState(() => Math.max(0, byName(wanted, tracks)));
  const [playing, setPlaying] = useState(!!wanted);
  const [pos, setPos] = useState(0);
  const [len, setLen] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const track = tracks[idx] ?? tracks[0];
  const isRen = track === REN_SONG;
  const st = stage(s);

  useEffect(() => {
    if (!playing) {
      stopMusic();
      audioRef.current = null;
      return;
    }
    const a = playMusic(track.file, () => setIdx((i) => (i + 1) % tracks.length));
    audioRef.current = a;
    setPos(0);
    setLen(track.len);
    const onMeta = () => setLen(Math.round(a.duration) || track.len);
    a.addEventListener('loadedmetadata', onMeta);
    const t = setInterval(() => setPos(Math.floor(a.currentTime)), 500);
    if (isRen) {
      setState((stt) => (stt.flags.listened_ren_song ? {} : { flags: { ...stt.flags, listened_ren_song: true }, ren: stt.ren + 1 }));
      setTimeout(() => think(s.flags.listened_ren_song ? 'опять её. на повторе. как он.' : 'без слов. медленно. как будто кто-то ходит по пустой квартире. это он и есть.'), 4000);
    } else if (!s.flags[`heard_${idx}`]) {
      setState((stt) => ({ flags: { ...stt.flags, [`heard_${idx}`]: true } }));
      const lines = ['эту мы с маю слушали всё лето. в наушниках на двоих.', 'дождь. демка без автора. нашла где-то на форуме.', 'дорога домой. она правда звучит как дорога домой.', 'sleepless. название честнее меня.'];
      setTimeout(() => think(st >= 2 && idx === 3 ? 'sleepless. теперь это не название.' : lines[idx] ?? ''), 3500);
    }
    return () => {
      clearInterval(t);
      a.removeEventListener('loadedmetadata', onMeta);
      stopMusic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, idx]);

  useEffect(() => setMusicMuted(s.muted), [s.muted]);
  useEffect(() => () => stopMusic(), []);

  useEffect(() => {
    if (wanted) {
      const i = byName(wanted, tracks);
      if (i >= 0) {
        setIdx(i);
        setPlaying(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted]);

  const fmt = (n: number) => `${Math.floor(n / 60)}:${String(Math.max(0, n) % 60).padStart(2, '0')}`;
  const total = len || track.len;

  return (
    <div className={`music ${isRen ? 'dark' : ''}`}>
      <div className="music-now">
        <div className={`music-art ${playing ? 'playing' : ''}`} style={isRen ? { background: 'radial-gradient(circle at 40% 35%, #4a5570, #1a1f2c 60%, #05070c)' } : { background: ['radial-gradient(circle at 40% 35%, #8a6a9a, #3a2a4a 60%, #1a1420)', 'radial-gradient(circle at 40% 35%, #6a8a9a, #2a3a4a 60%, #141a20)', 'radial-gradient(circle at 40% 35%, #c08a70, #5a3a30 60%, #201410)', 'radial-gradient(circle at 40% 35%, #5a6a90, #202a44 60%, #0c1020)'][idx % 4] }} />
        <div>
          <div style={{ fontSize: 15 }}>{track.title}</div>
          <div style={{ opacity: 0.7, fontSize: 12 }}>{track.artist}</div>
          {isRen && <div style={{ opacity: 0.5, fontSize: 11, marginTop: 4 }}>прислал REN_17 · без названия · 128 kbps</div>}
          {!isRen && <div style={{ opacity: 0.4, fontSize: 11, marginTop: 4 }}>mp3 · 128 kbps · music/</div>}
        </div>
      </div>
      <div className="music-list">
        {tracks.map((t, i) => (
          <div
            key={t.title}
            className={`clickable ${i === idx ? 'active' : ''}`}
            role="button"
            title={TOUCH ? 'нажми — играть' : 'двойной клик — играть'}
            {...openOn(() => {
              playSound('click');
              setIdx(i);
              setPlaying(true);
            })}
          >
            <span>
              {i === idx && playing ? '♪ ' : `${i + 1}. `}
              {t.title} — {t.artist}
            </span>
            <span style={{ opacity: 0.6 }}>{fmt(t.len)}</span>
          </div>
        ))}
      </div>
      <div className="music-ctrl">
        <button onClick={() => setIdx((i) => (i - 1 + tracks.length) % tracks.length)} title="Предыдущий">
          ⏮
        </button>
        <button onClick={() => setPlaying((p) => !p)} title={playing ? 'Пауза' : 'Играть'}>
          {playing ? '❚❚' : '▶'}
        </button>
        <button onClick={() => setIdx((i) => (i + 1) % tracks.length)} title="Следующий">
          ⏭
        </button>
        <div
          className="music-bar clickable"
          role="slider"
          aria-valuenow={pos}
          onClick={(e) => {
            const a = audioRef.current;
            if (!a) return;
            const r = e.currentTarget.getBoundingClientRect();
            a.currentTime = ((e.clientX - r.left) / r.width) * (a.duration || total);
          }}
        >
          <div style={{ width: `${Math.min(100, (pos / total) * 100)}%` }} />
        </div>
        <span style={{ fontSize: 11, opacity: 0.8 }}>
          {fmt(pos)} / {fmt(total)}
        </span>
      </div>
    </div>
  );
}
