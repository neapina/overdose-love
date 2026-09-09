import { useEffect } from 'react';
import { stage, useGameState } from './state/store';
import { Boot } from './os/Boot';
import { Login } from './os/Login';
import { Desktop } from './os/Desktop';
import { Ending, Interlude, Sleep } from './os/Screens';
import { unlockAudio } from './os/sounds';
import { canFullscreen, requestFullscreen, TOUCH, useFullscreen, useViewport } from './os/viewport';

export default function App() {
  const s = useGameState();
  const st = stage(s);
  const vp = useViewport();
  const fullscreen = useFullscreen();

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const scaled = vp.scale !== 1;
  const screenStyle = scaled ? { width: vp.w, height: vp.h, transform: `scale(${vp.scale})`, transformOrigin: '0 0' } : undefined;

  return (
    <>
      <div className={`screen stage-${st} ${TOUCH ? 'touch' : ''}`} style={screenStyle}>
        {s.phase === 'boot' && <Boot />}
        {s.phase === 'login' && <Login />}
        {s.phase === 'desktop' && <Desktop />}
        {s.phase === 'sleep' && <Sleep />}
        {s.phase === 'interlude' && <Interlude />}
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
      {TOUCH && !fullscreen && canFullscreen() && !vp.portrait && s.phase !== 'desktop' && (
        <button className="fs-btn" onClick={requestFullscreen} title="На весь экран">
          ⛶
        </button>
      )}
      {TOUCH && vp.portrait && (
        <div className="rotate-hint" onClick={requestFullscreen}>
          <div className="rotate-phone">📱</div>
          <b>поверни телефон</b>
          <span>NANA.NET играется горизонтально — как на мониторе</span>
        </div>
      )}
    </>
  );
}
