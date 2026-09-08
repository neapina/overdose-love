import { useEffect, useRef, useState } from 'react';
import { formatClock, isNight, setState, useGameState, type Contact } from '../state/store';
import { chooseOption, getPendingChoice, markRead, pushMessage } from '../story/engine';
import { CONVERSATIONS } from '../story/content';
import { renderPhoto } from '../story/photos';
import { avatar } from '../story/avatars';
import { playSound } from '../os/sounds';
import { CONTACT_INFO } from './contacts';

const IDLE_REPLIES: Record<Contact, string[]> = {
  mayu: ['ахах', 'ок ✌🏻', 'потом расскажу, я с мамой', 'НАНА иди спать', 'ты опять за компом?', 'ага'],
  ren: ['…', 'да', 'я тут', 'читаю', 'не спится?', 'ты как?', 'потом'],
};

let idleTimer: ReturnType<typeof setTimeout> | null = null;

export function Chat({ contact, channel }: { contact: Contact; channel: 'meromero' | 'messenger' }) {
  const s = useGameState();
  const [text, setText] = useState('');
  const logRef = useRef<HTMLDivElement>(null);
  const info = CONTACT_INFO[contact];
  const msgs = s.messages.filter((m) => m.contact === contact);
  const online = contact === 'ren' ? s.renOnline : s.mayuOnline;
  const gone = contact === 'ren' && !!s.flags.ren_gone;
  const pending = s.pendingChoice;
  const pendingConv = pending ? CONVERSATIONS.find((c) => c.id === pending.conversation) : null;
  const choice = pendingConv && pendingConv.contact === contact ? getPendingChoice() : null;
  const unread = s.unread[contact];

  useEffect(() => {
    if (unread) markRead(contact);
  }, [contact, unread]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' });
  }, [msgs.length, s.renTyping, choice]);

  function send() {
    const t = text.trim();
    if (!t) return;
    setText('');
    playSound('click');
    pushMessage({ from: 'nana', contact, text: t, channel });
    if (contact === 'ren' && isNight(s)) setState((st) => ({ ren: st.ren + 0.25 }));
    if (!online || gone || s.activeConversation) return;
    if (idleTimer) clearTimeout(idleTimer);
    const pool = IDLE_REPLIES[contact];
    const reply = pool[(s.nextMessageId + t.length) % pool.length];
    if (contact === 'ren') setState({ renTyping: true });
    idleTimer = setTimeout(() => {
      if (contact === 'ren') setState({ renTyping: false });
      pushMessage({ from: contact, contact, text: reply, channel });
    }, 1800 + reply.length * 60);
  }

  return (
    <div className="chat">
      <div className="chat-head">
        <img className="av" src={avatar(gone ? 'unknown' : info.avatar, 36)} alt="" />
        <div>
          <div className="nm">{gone ? 'пользователь не найден' : info.name}</div>
          <div className="st">
            <i className={`dot ${!gone && online ? 'on' : 'off'}`} /> {gone ? 'USER NOT FOUND' : online ? 'в сети' : 'не в сети'}
            {channel === 'meromero' ? ' · личные сообщения meromero.net' : ' · M Messenger'}
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
        {contact === 'ren' && s.renTyping && <div className="typing">{info.name} печатает</div>}
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
      ) : (
        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={online ? 'Написать сообщение…' : 'Не в сети — сообщение будет доставлено позже'} />
          <button className="btn primary" type="submit">
            Отпр.
          </button>
        </form>
      )}
    </div>
  );
}
