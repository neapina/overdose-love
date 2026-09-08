import { useEffect, useRef } from 'react';
import { formatClock, setState, useGameState, type Contact } from '../state/store';
import { chooseOption, getPendingChoice, markRead, sayIdle } from '../story/engine';
import { CONVERSATIONS } from '../story/content';
import { idleOpeners } from '../story/social';
import { renderPhoto } from '../story/photos';
import { avatar } from '../story/avatars';
import { playSound } from '../os/sounds';
import { CONTACT_INFO } from './contacts';

export function Chat({ contact, channel }: { contact: Contact; channel: 'meromero' | 'messenger' }) {
  const s = useGameState();
  const logRef = useRef<HTMLDivElement>(null);
  const info = CONTACT_INFO[contact];
  const msgs = s.messages.filter((m) => m.contact === contact);
  const online = contact === 'ren' ? s.renOnline : s.mayuOnline;
  const typing = contact === 'ren' ? s.renTyping : s.mayuTyping;
  const gone = contact === 'ren' && !!s.flags.ren_gone;
  const pending = s.pendingChoice;
  const pendingConv = pending ? CONVERSATIONS.find((c) => c.id === pending.conversation) : null;
  const choice = pendingConv && pendingConv.contact === contact ? getPendingChoice() : null;
  const openers = !choice && !s.activeConversation && !gone ? idleOpeners(contact, s) : [];
  const unread = s.unread[contact];

  useEffect(() => {
    if (unread) markRead(contact);
  }, [contact, unread]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' });
  }, [msgs.length, typing, choice]);

  return (
    <div className="chat">
      <div className="chat-head">
        <img className="av" src={avatar(gone ? 'unknown' : info.avatar, 36)} alt="" />
        <div>
          <div className="nm">{gone ? 'пользователь не найден' : info.name}</div>
          <div className="st">
            <i className={`dot ${!gone && online ? 'on' : 'off'}`} /> {gone ? 'USER NOT FOUND' : online ? 'в сети' : 'не в сети'}
            {channel === 'meromero' ? ' · сообщения meromero' : ' · M Messenger'}
          </div>
        </div>
      </div>
      <div className="chat-log" ref={logRef}>
        {msgs.length === 0 && <div className="bubble sys">Сообщений пока нет</div>}
        {msgs.map((m) => (
          <div key={m.id} className={`bubble ${m.from === 'nana' ? 'me' : m.from === 'system' ? 'sys' : `them ${m.from}`}`}>
            {m.photo && <img className="photo" src={renderPhoto(m.photo, 400, 300)} alt="" />}
            {m.text}
            {m.from !== 'system' && <span className="time">{formatClock(m.time)}</span>}
          </div>
        ))}
        {typing && <div className="typing">{info.name} печатает</div>}
      </div>
      {choice ? (
        <div className="choices">
          {choice.options.map((o, i) => (
            <button key={i} className="choice" onClick={() => chooseOption(i)}>
              {o.text}
            </button>
          ))}
        </div>
      ) : gone ? (
        <div className="chat-hint">Этот пользователь удалил аккаунт или был удалён.</div>
      ) : openers.length ? (
        <div className="choices quiet">
          {openers.map((o) => (
            <button
              key={o.key}
              className="choice"
              onClick={() => {
                playSound('click');
                setState((st) => ({ flags: { ...st.flags, [`idle_${contact}_${o.key}_d${st.day}`]: true } }));
                sayIdle(contact, o, channel);
              }}
            >
              {o.text}
            </button>
          ))}
        </div>
      ) : (
        <div className="chat-hint">{s.activeConversation ? '…' : online ? 'Нане нечего сказать. Пока.' : `${info.name} не в сети`}</div>
      )}
    </div>
  );
}
