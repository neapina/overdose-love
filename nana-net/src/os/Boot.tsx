import { useEffect, useState } from 'react';
import { CONFIG } from '../config';
import { setState, useGame } from '../state/store';

export function Boot() {
  const [step, setStep] = useState(0);
  const day = useGame((s) => s.day);
  const hasSave = useGame((s) => s.sleepCount > 0 || s.day > 1);
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 1400);
    const t2 = setTimeout(() => setState({ phase: 'login' }), 3400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  return (
    <div className="boot">
      <div className="boot-logo" />
      <div className="boot-bar">
        <div />
      </div>
      <div className="boot-text">
        {step === 0 ? `Запуск ${CONFIG.osName}…` : hasSave ? `Восстановление сеанса · день ${day}` : `${CONFIG.osName} · ${CONFIG.computerName}`}
      </div>
    </div>
  );
}
