import { useState } from 'react';
import { formatClock, setState, toast, useGameState } from '../state/store';
import { renderPhoto } from '../story/photos';
import { playSound } from '../os/sounds';
import { openWindow } from '../state/windows';

export function Camera() {
  const s = useGameState();
  const [flash, setFlash] = useState(0);
  const preview = renderPhoto(`webcam_${s.photosTaken + 1}`, 480, 360);

  function shoot() {
    playSound('camera');
    setFlash((f) => f + 1);
    const n = s.photosTaken + 1;
    setState((st) => ({ photosTaken: st.photosTaken + 1, flags: { ...st.flags, took_selfie: true } }));
    toast('Камера', `Снимок сохранён: WIN_2011_${String(n).padStart(3, '0')}.jpg`, '/assets/mm/camera.png');
  }

  return (
    <div className="camera">
      <div className="camera-view">
        <img src={preview} alt="" />
        <div className="fx-layer fx-noise" style={{ opacity: 0.18 }} />
        <div className="rec">LIVE · {formatClock(s.clock)}</div>
        {flash > 0 && <div key={flash} className="camera-flash" />}
      </div>
      <div className="camera-bar">
        <button className="btn primary" onClick={shoot}>
          Снять фото
        </button>
        <button className="btn" onClick={() => openWindow('photos', s.photosTaken ? { photo: `webcam_${s.photosTaken}` } : undefined)}>
          Галерея ({s.photosTaken})
        </button>
      </div>
    </div>
  );
}
