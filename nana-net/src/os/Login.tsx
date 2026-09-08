import { useEffect, useRef, useState } from 'react';
import { CONFIG } from '../config';
import { setState, useGame } from '../state/store';
import { playSound, unlockAudio } from './sounds';
import { avatar } from '../story/avatars';
import { formatClock } from '../state/store';

export function Login() {
  const [login, setLogin] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [tries, setTries] = useState(0);
  const [welcome, setWelcome] = useState(false);
  const day = useGame((s) => s.day);
  const clock = useGame((s) => s.clock);
  const stageAvatar = useGame((s) => (s.day >= 6 ? 'nana3' : s.day >= 3 ? 'nana2' : 'nana'));
  const loginRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loginRef.current?.focus();
  }, []);

  function submit() {
    unlockAudio();
    const okLogin = login.trim().toLowerCase() === CONFIG.login;
    const okPass = pass === CONFIG.password;
    if (okLogin && okPass) {
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
    if (!okLogin) setErr('Пользователь не найден. Единственная учётная запись на этом компьютере — nana.');
    else setErr(tries >= 1 ? `Неверный пароль. ${CONFIG.passwordHint}` : 'Неверный пароль.');
    setPass('');
  }

  if (welcome) {
    return (
      <div className="login">
        <div className="login-card">
          <div className="login-avatar">
            <img src={avatar(stageAvatar, 128)} alt="" />
          </div>
          <div className="welcome">Добро пожаловать</div>
        </div>
        <div className="login-footer">{CONFIG.osName}™ · {CONFIG.computerName}</div>
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
        <div className="login-name">{login.trim() ? login.trim() : 'Кто там?'}</div>
        <div className="login-row">
          <input ref={loginRef} className="login-input" placeholder="Пользователь" value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="off" />
        </div>
        <div className="login-row">
          <input className="login-input" type="password" placeholder="Пароль" value={pass} onChange={(e) => setPass(e.target.value)} />
          <button className="login-go" type="submit" aria-label="Войти">
            →
          </button>
        </div>
        {err ? <div className="login-error">{err}</div> : <div className="login-hint">{day > 1 ? `день ${day} · ${formatClock(clock)}` : 'Введите имя пользователя и пароль'}</div>}
      </form>
      <div className="login-footer">{CONFIG.osName}™ · {CONFIG.computerName}</div>
    </div>
  );
}
