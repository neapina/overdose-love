import { useEffect } from 'react';
import { stage, useGameState } from './state/store';
import { Boot } from './os/Boot';
import { Login } from './os/Login';
import { Desktop } from './os/Desktop';
import { Ending, Sleep } from './os/Screens';
import { unlockAudio } from './os/sounds';

export default function App() {
  const s = useGameState();
  const st = stage(s);

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  return (
    <div className={`screen stage-${st}`}>
      {s.phase === 'boot' && <Boot />}
      {s.phase === 'login' && <Login />}
      {s.phase === 'desktop' && <Desktop />}
      {s.phase === 'sleep' && <Sleep />}
      {s.phase === 'ending' && <Ending />}
      {s.effects && (
        <>
          <div className="fx-layer fx-scanlines" />
          <div className="fx-layer fx-noise" style={{ opacity: 0.05 + st * 0.03 }} />
          <div className="fx-layer fx-vignette" />
          <div className="fx-layer fx-dim" style={{ opacity: 0.3 + st * 0.25 }} />
          {st >= 2 && <div className="fx-layer fx-flicker" />}
        </>
      )}
    </div>
  );
}
