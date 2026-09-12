import { useEffect, useRef, useState } from 'react';
import { CONFIG } from '../config';
import { formatClock, setState, stage as stageOf, useGame } from '../state/store';
import { playSound, unlockAudio } from './sounds';
import { avatar } from '../story/avatars';

export function Login() {
  const [pass, setPass] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [tries, setTries] = useState(0);
  const [welcome, setWelcome] = useState(false);
  const day = useGame((s) => s.day);
  const clock = useGame((s) => s.clock);
  const stage = useGame((s) => stageOf(s));
  const stageAvatar = stage >= 3 ? 'nana3' : stage >= 1 ? 'nana2' : 'nana';
  const passRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    passRef.current?.focus();
  }, []);

  function submit() {
    unlockAudio();
    if (pass.trim().toLowerCase() === CONFIG.password) {
      setErr(null);
      setWelcome(true);
      playSound('logon');
      setTimeout(() => setState({ phase: 'desktop' }), 2200);
      return;
    }
    playSound('error');
    setShake(true);
    setTimeout(() => setShake(false), 400);
    setTries((t) => t + 1);
    setErr(tries >= 2 ? 'Неверный пароль. На записке: любимый цветок, латиницей, 6 букв.' : tries >= 1 ? 'Неверный пароль. Записка на мониторе.' : 'Неверный пароль.');
    setPass('');
  }

  // the note on the monitor never spells the whole word; after a few tries it fills in
  const pw = CONFIG.password;
  const masked = tries >= 3 ? pw : tries >= 2 ? pw.slice(0, 3) + '·'.repeat(pw.length - 3) : pw[0] + '·'.repeat(pw.length - 2) + pw[pw.length - 1];
  const note = day === 1 ? ['(любимый цветок, латиницей, 6 букв)', '', 'маю: «ЗАРЕГАЙСЯ УЖЕ» ✌'] : stage >= 3 ? ['', 'не спать', 'не спать', 'не спать'] : stage >= 2 ? ['', 'после 22:30', '', ''] : ['', 'маю — ответить', 'англ — unit 7'];
  const todo = day === 1 ? ['англ. unit 7 — тест', 'матем. стр. 41', 'молоко!!'] : stage >= 3 ? ['track07', 'track07', 'track07'] : stage >= 2 ? ['22:30', 'обои поменять', ''] : ['фотки маю → папка', 'история, параграф 12', 'спать до 1 (ха)'];

  if (welcome) {
    return (
      <div className="login">
        <div className="login-card">
          <div className="login-avatar">
            <img src={avatar(stageAvatar, 128)} alt="" />
          </div>
          <div className="welcome">Добро пожаловать</div>
        </div>
        <div className="login-footer">
          {CONFIG.osName}™ · {CONFIG.computerName}
        </div>
      </div>
    );
  }

  return (
    <div className="login">
      <form
        className={`login-card ${shake ? 'login-shake' : ''}`}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="login-avatar">
          <img src={avatar(stageAvatar, 128)} alt="" />
        </div>
        <div className="login-name">{CONFIG.login}</div>
        <div className="login-row">
          <input ref={passRef} className="login-input" type="password" placeholder="Пароль" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="off" />
          <button className="login-go" type="submit" aria-label="Войти">
            →
          </button>
        </div>
        {err ? <div className="login-error">{err}</div> : <div className="login-hint">{day > 1 ? `день ${day} · ${formatClock(clock)} · с возвращением` : 'Единственная учётная запись на этом компьютере'}</div>}
      </form>
      <div className={`sticky ${stage >= 2 ? 'dark' : ''}`} aria-label="записка на мониторе" title="записка на мониторе">
        <div>
          пароль:
          <span className="sticky-pw" aria-label={`пароль: ${masked}`}>
            {masked}
          </span>
          {stage < 3 && ' ✿'}
        </div>
        {note.map((l, i) => (
          <div key={i}>{l || '\u00a0'}</div>
        ))}
        <div className="sticky-doodle" aria-hidden>
          🌸
        </div>
      </div>
      <div className={`sticky-2 ${stage >= 2 ? 'dark' : ''}`} aria-hidden>
        <b>{day === 1 ? '10.13' : `10.${12 + day}`}</b>
        {todo.map((l, i) => (
          <div key={i}>{l || '\u00a0'}</div>
        ))}
      </div>
      <div className="login-footer">
        {CONFIG.osName}™ · {CONFIG.computerName}
      </div>
    </div>
  );
}
