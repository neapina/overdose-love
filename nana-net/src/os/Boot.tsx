import { useEffect, useState } from 'react';
import { CONFIG } from '../config';
import { setState, useGame } from '../state/store';

type Line = { text: string; cls?: string };

const BIOS: Line[] = [
  { text: 'Award Modular BIOS v6.00PG, An Energy Star Ally', cls: 'dim' },
  { text: 'Copyright (C) 1984-2009, Award Software, Inc.', cls: 'dim' },
  { text: '' },
  { text: `${CONFIG.computerName}  ·  Pentium(R) Dual-Core  E5400 @ 2.70GHz` },
  { text: 'Memory Test :  2097152K OK', cls: 'ok' },
  { text: '' },
  { text: 'Detecting IDE drives ...' },
  { text: '  Primary Master   : WDC WD3200AAJS-00L7A0' },
  { text: '  Secondary Master : HL-DT-ST DVDRAM GH22NS50' },
  { text: '' },
  { text: 'USB Device(s): 1 Keyboard, 1 Mouse, 1 Storage Device' },
  { text: 'Verifying DMI Pool Data ............ ', cls: 'ok' },
];

export function Boot() {
  const [n, setN] = useState(0);
  const [seven, setSeven] = useState(false);
  const day = useGame((s) => s.day);
  const hasSave = useGame((s) => s.sleepCount > 0 || s.day > 1);

  useEffect(() => {
    if (seven) return;
    if (n >= BIOS.length) {
      const t = setTimeout(() => setSeven(true), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN((k) => k + 1), n === 0 ? 400 : BIOS[n - 1].text === '' ? 60 : 110 + Math.random() * 140);
    return () => clearTimeout(t);
  }, [n, seven]);

  useEffect(() => {
    if (!seven) return;
    const t = setTimeout(() => setState({ phase: 'login' }), 2600);
    return () => clearTimeout(t);
  }, [seven]);

  return (
    <div className="boot">
      <div className="boot-bios">
        {BIOS.slice(0, n).map((l, i) => (
          <div key={i} className={l.cls}>
            {l.text || '\u00a0'}
          </div>
        ))}
        {n < BIOS.length && <span className="boot-cursor" />}
      </div>
      {seven && (
        <div className="boot-seven">
          <div className="boot-logo" />
          <div className="boot-bar">
            <div />
          </div>
          <div className="boot-text">{hasSave ? `${CONFIG.osName} · день ${day}` : `${CONFIG.osName}`}</div>
        </div>
      )}
    </div>
  );
}
