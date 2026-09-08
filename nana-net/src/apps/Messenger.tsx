import { useGameState, type Contact, type WindowState } from '../state/store';
import { setWindowTitle } from '../state/windows';
import { setState } from '../state/store';
import { avatar } from '../story/avatars';
import { Chat } from './Chat';
import { CONTACT_INFO } from './contacts';
import { CONVERSATIONS } from '../story/content';

export function Messenger({ win }: { win: WindowState }) {
  const s = useGameState();
  const contact = win.props?.contact as Contact | undefined;

  function open(c: Contact | null) {
    setState((st) => ({ windows: st.windows.map((w) => (w.id === win.id ? { ...w, props: { ...w.props, contact: c ?? undefined } } : w)) }));
    setWindowTitle(win.id, c ? `${CONTACT_INFO[c].name} — M Messenger` : 'M Messenger');
  }

  if (contact) {
    return (
      <div className="msgr">
        <div className="menubar">
          <span className="clickable" role="button" onClick={() => open(null)}>
            ‹ Контакты
          </span>
        </div>
        <Chat contact={contact} channel="messenger" />
      </div>
    );
  }

  const pendingConv = s.pendingChoice ? CONVERSATIONS.find((c) => c.id === s.pendingChoice!.conversation) : null;
  const status = s.day >= 5 ? 'не сплю' : s.day >= 3 ? 'онлайн' : s.profile.status || 'привет';
  const contacts: { id: Contact; online: boolean; group: string }[] = [
    { id: 'ren', online: s.renOnline && !s.flags.ren_gone, group: 'Избранное' },
    { id: 'mayu', online: s.mayuOnline, group: 'Друзья' },
  ];
  const others = ['yuki_02', 'kaori.k', 'sensei_bot'];

  return (
    <div className="msgr">
      <div className="msgr-me">
        <img src={avatar(s.day >= 6 ? 'nana3' : s.day >= 3 ? 'nana2' : 'nana', 40)} alt="" />
        <div>
          <div className="nm">nana</div>
          <div className="st">
            <i className="dot on" /> {status}
          </div>
        </div>
      </div>
      <div className="msgr-list">
        {['Избранное', 'Друзья'].map((g) => (
          <div key={g}>
            <div className="msgr-group">{g}</div>
            {contacts
              .filter((c) => c.group === g)
              .map((c) => {
                const gone = c.id === 'ren' && s.flags.ren_gone;
                const waiting = pendingConv?.contact === c.id;
                return (
                  <div key={c.id} className={`msgr-contact clickable ${gone ? 'gone' : ''}`} role="button" onClick={() => open(c.id)}>
                    <img className="av" src={avatar(gone ? 'unknown' : CONTACT_INFO[c.id].avatar, 32)} alt="" />
                    <div>
                      <div className="nm">{gone ? 'user not found' : CONTACT_INFO[c.id].name}</div>
                      <div className="st">{gone ? '—' : waiting ? 'ждёт ответа…' : c.online ? 'в сети' : 'не в сети'}</div>
                    </div>
                    {(s.unread[c.id] > 0 || waiting) && <span className="badge">{s.unread[c.id] || '!'}</span>}
                  </div>
                );
              })}
            {g === 'Друзья' &&
              others.map((o, i) => (
                <div key={o} className="msgr-contact" style={{ opacity: 0.6 }}>
                  <img className="av" src={avatar(['yuki', 'kaori', 'unknown'][i], 32)} alt="" />
                  <div>
                    <div className="nm">{o}</div>
                    <div className="st">не в сети</div>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
      <div className="statusbar">
        <span>M Messenger 2.1</span>
        <span>{s.renOnline && !s.flags.ren_gone ? 'REN_17 в сети' : 'REN_17 не в сети'}</span>
      </div>
    </div>
  );
}
