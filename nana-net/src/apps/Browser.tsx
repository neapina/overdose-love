import { useState } from 'react';
import { formatClock, setState, useGameState, type Contact, type Post, type WindowState } from '../state/store';
import { setWindowTitle } from '../state/windows';
import { addPost } from '../story/engine';
import { avatar } from '../story/avatars';
import { renderPhoto } from '../story/photos';
import { playSound } from '../os/sounds';
import { Chat } from './Chat';
import { CONTACT_INFO } from './contacts';
import { SONGS } from '../story/fs';

type Page = 'home' | 'feed' | 'profile' | 'messages' | 'user' | '404';

const URLS: Record<Page, string> = {
  home: 'about:home',
  feed: 'http://meromero.net/feed',
  profile: 'http://meromero.net/nana',
  messages: 'http://meromero.net/messages',
  user: 'http://meromero.net/u/',
  404: 'http://',
};

const AVATARS = ['nana', 'nana2', 'yuki', 'kaori'];

export function Browser({ win }: { win: WindowState }) {
  const s = useGameState();
  const page = (win.props?.page as Page | undefined) ?? 'home';
  const contact = win.props?.contact as Contact | undefined;
  const user = win.props?.user as string | undefined;
  const [addr, setAddr] = useState(URLS[page] + (page === 'user' ? user ?? '' : ''));

  function nav(p: Page, extra: Record<string, unknown> = {}) {
    playSound('click');
    setState((st) => ({ windows: st.windows.map((w) => (w.id === win.id ? { ...w, props: { ...w.props, page: p, contact: undefined, user: undefined, ...extra } } : w)) }));
    setAddr(URLS[p] + (p === 'user' ? (extra.user as string) ?? '' : ''));
    setWindowTitle(win.id, p === 'home' ? 'Браузер' : p === 'messages' && extra.contact ? `Сообщения · ${CONTACT_INFO[extra.contact as Contact].name} — meromero.net` : 'meromero.net');
  }

  function go(url: string) {
    const u = url.trim().toLowerCase();
    if (!u || u === 'about:home') return nav('home');
    if (u.includes('meromero')) {
      if (u.includes('messages')) return nav('messages');
      if (u.includes('/nana')) return nav('profile');
      if (u.includes('/u/ren')) return nav('user', { user: 'ren' });
      if (u.includes('/u/mayu')) return nav('user', { user: 'mayu' });
      return nav('feed');
    }
    nav('404');
    setAddr(url);
  }

  return (
    <div className="browser">
      <div className="toolbar">
        <button className="navbtn" onClick={() => nav(page === 'home' ? 'home' : page === 'feed' ? 'home' : 'feed')} title="Назад">
          ‹
        </button>
        <button className="navbtn" disabled>
          ›
        </button>
        <form
          className="addr"
          onSubmit={(e) => {
            e.preventDefault();
            go(addr);
          }}
        >
          <span style={{ color: '#7a8', fontSize: 11 }}>🔒</span>
          <input value={addr} onChange={(e) => setAddr(e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12 }} />
        </form>
        <button className="btn" onClick={() => nav('feed')}>
          ★ meromero
        </button>
      </div>
      <div className="page">
        {page === 'home' && <Home nav={nav} />}
        {page === '404' && (
          <div className="home-page">
            <h2 style={{ fontWeight: 400 }}>Не удаётся отобразить страницу</h2>
            <p>Проверьте подключение к интернету или попробуйте позже.</p>
            <a className="clickable" onClick={() => nav('home')}>
              Домашняя страница
            </a>
          </div>
        )}
        {page !== 'home' && page !== '404' && (
          <div className="mm">
            <div className="mm-top">
              <div className="mm-logo clickable" role="button" onClick={() => nav('feed')}>
                <img src="/assets/icons/meromero.png" alt="" />
                meromero
              </div>
              <div className="mm-tabs">
                <button className={page === 'feed' ? 'active' : ''} onClick={() => nav('feed')}>
                  Лента
                </button>
                <button className={page === 'profile' ? 'active' : ''} onClick={() => nav('profile')}>
                  Моя страница
                </button>
                <button className={page === 'messages' ? 'active' : ''} onClick={() => nav('messages')}>
                  Сообщения
                  {s.unread.ren + s.unread.mayu > 0 && <span className="badge">{s.unread.ren + s.unread.mayu}</span>}
                </button>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 12, color: '#7a4a5e' }}>
                <i className="dot on" /> nana
              </div>
            </div>
            {page === 'feed' && <Feed nav={nav} />}
            {page === 'profile' && <Profile nav={nav} />}
            {page === 'messages' && <Messages contact={contact} nav={nav} />}
            {page === 'user' && <UserPage user={user ?? 'ren'} nav={nav} />}
          </div>
        )}
      </div>
    </div>
  );
}

type Nav = (p: Page, extra?: Record<string, unknown>) => void;

function Home({ nav }: { nav: Nav }) {
  return (
    <div className="home-page">
      <h1 style={{ fontWeight: 300, color: '#345' }}>Добро пожаловать</h1>
      <p>Закладки</p>
      <a className="clickable" onClick={() => nav('feed')}>
        meromero.net — лента
      </a>
      <a className="clickable" onClick={() => nav('profile')}>
        meromero.net — моя страница
      </a>
      <a className="clickable" onClick={() => nav('messages')}>
        meromero.net — сообщения
      </a>
      <p style={{ marginTop: 40, fontSize: 11, color: '#99a' }}>История: meromero.net/register · meromero.net/nana · «как поменять песню в профиле»</p>
    </div>
  );
}

function Sidebar({ nav }: { nav: Nav }) {
  const s = useGameState();
  const gone = !!s.flags.ren_gone;
  return (
    <div className="mm-side">
      <div className="mm-card">
        <h4>Друзья ({s.flags.ren_commented && !gone ? 2 : 1})</h4>
        <div className="mm-friend clickable" role="button" onClick={() => nav('user', { user: 'mayu' })}>
          <img className="av" src={avatar('mayu', 28)} alt="" />
          <span>
            <i className={`dot ${s.mayuOnline ? 'on' : 'off'}`} /> mayu☆
          </span>
        </div>
        {s.flags.ren_commented && (
          <div className="mm-friend clickable" role="button" onClick={() => nav('user', { user: 'ren' })} style={gone ? { opacity: 0.5 } : undefined}>
            <img className="av" src={avatar(gone ? 'unknown' : 'ren', 28)} alt="" />
            <span>
              <i className={`dot ${!gone && s.renOnline ? 'on' : 'off'}`} /> {gone ? 'user not found' : 'REN_17'}
            </span>
          </div>
        )}
      </div>
      <div className="mm-card">
        <h4>Сейчас на сайте</h4>
        <div className="pad" style={{ fontSize: 12 }}>
          {[s.mayuOnline && 'mayu☆', s.renOnline && !gone && 'REN_17', 'yuki_02', s.day % 2 ? 'kaori.k' : null].filter(Boolean).join(' · ')}
        </div>
      </div>
      <div className="mm-card">
        <h4>Музыка профиля</h4>
        <div className="pad" style={{ fontSize: 12 }}>
          {s.profile.song ? (
            <span>
              ♪ {s.profile.song}
              <br />
              <small style={{ color: '#889' }}>слушали: {3 + s.day * 2}</small>
            </span>
          ) : (
            <span style={{ color: '#999' }}>не выбрана</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Feed({ nav }: { nav: Nav }) {
  const s = useGameState();
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<string | undefined>();
  const posts = [...s.posts].reverse();
  const myPhotos = ['sky_1', 'room_1', 'city_1', ...Array.from({ length: s.photosTaken }, (_, i) => `webcam_${i + 1}`)];

  function post() {
    if (!text.trim()) return;
    addPost('nana', text.trim(), photo);
    setText('');
    setPhoto(undefined);
    playSound('notify');
    setState((st) => ({ flags: { ...st.flags, posted: true }, mayu: st.mayu + (st.flags.posted ? 0 : 1) }));
  }

  return (
    <div className="mm-body">
      <Sidebar nav={nav} />
      <div className="mm-main">
        <div className="mm-card">
          <h4>Что нового?</h4>
          <div className="mm-compose">
            <img src={avatar(AVATARS[s.profile.avatar] ?? 'nana', 40)} alt="" style={{ width: 40, height: 40, borderRadius: 5 }} />
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={s.flags.posted ? 'написать ещё…' : 'первая запись… ну хоть «привет»'} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button className="btn pink" onClick={post}>
                Опубликовать
              </button>
              <select className="input" value={photo ?? ''} onChange={(e) => setPhoto(e.target.value || undefined)} style={{ fontSize: 11 }}>
                <option value="">без фото</option>
                {myPhotos.map((p) => (
                  <option key={p} value={p}>
                    {p.startsWith('webcam') ? `вебка ${p.split('_')[1]}` : p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="mm-card">
          <h4>Лента</h4>
          {posts.length === 0 && (
            <div className="pad" style={{ color: '#999' }}>
              Пока пусто. Добавь друзей или напиши первую запись.
            </div>
          )}
          {posts.map((p) => (
            <PostView key={p.id} post={p} nav={nav} />
          ))}
          {s.day === 1 && (
            <div className="mm-post" style={{ opacity: 0.7 }}>
              <img className="av" src={avatar('yuki', 40)} alt="" />
              <div>
                <span className="who">yuki_02</span>
                <span className="when">вчера</span>
                <div className="txt">кто-нибудь знает как убрать музыку с автоплеем со страницы?? помогите</div>
                <div className="mm-actions">
                  <span>
                    <img src="/assets/mm/heart-small.png" alt="" /> 2
                  </span>
                  <span>комментарии (4)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PostView({ post, nav }: { post: Post; nav: Nav }) {
  const s = useGameState();
  const [liked, setLiked] = useState(false);
  const who = post.author === 'nana' ? 'nana' : post.author === 'mayu' ? 'mayu☆' : post.author === 'ren' ? 'REN_17' : post.author;
  const av = post.author === 'nana' ? AVATARS[s.profile.avatar] ?? 'nana' : post.author === 'mayu' ? 'mayu' : post.author === 'ren' ? 'ren' : 'unknown';
  return (
    <div className="mm-post">
      <img className="av clickable" src={avatar(av, 40)} alt="" onClick={() => post.author !== 'nana' && nav('user', { user: post.author })} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <span className={`who ${post.author}`}>{who}</span>
        <span className="when">
          день {post.day} · {formatClock(post.time)}
        </span>
        <div className="txt">{post.text}</div>
        {post.photo && <img className="photo" src={renderPhoto(post.photo, 320, 240)} alt="" />}
        <div className="mm-actions">
          <span
            className="clickable"
            role="button"
            onClick={() => {
              if (!liked) playSound('click');
              setLiked(true);
            }}
          >
            <img src={liked ? '/assets/mm/heart-small.png' : '/assets/mm/heart-grey.png'} alt="" /> {post.likes + (liked ? 1 : 0)}
          </span>
          <span>комментарии ({post.comments.length})</span>
        </div>
        {post.comments.map((c, i) => (
          <div key={i} className="mm-comment">
            <b className="clickable" onClick={() => nav('user', { user: c.author === 'REN_17' ? 'ren' : 'mayu' })}>
              {c.author}
            </b>
            : {c.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function Profile({ nav }: { nav: Nav }) {
  const s = useGameState();
  const [status, setStatus] = useState(s.profile.status);
  const posts = s.posts.filter((p) => p.author === 'nana').reverse();

  function save(patch: Partial<typeof s.profile>) {
    setState((st) => ({ profile: { ...st.profile, ...patch }, flags: { ...st.flags, profile_edited: true } }));
    playSound('click');
  }

  return (
    <div className="mm-body">
      <Sidebar nav={nav} />
      <div className="mm-main">
        <div className="mm-card">
          <div className="mm-banner" style={{ backgroundImage: `url(/assets/mm/banner-${s.profile.theme}.png)` }}>
            <img className="av" src={avatar(AVATARS[s.profile.avatar] ?? 'nana', 64)} alt="" />
          </div>
          <div className="mm-profile-info">
            <b>nana</b> <span style={{ color: '#889', fontSize: 11 }}>· 16 · Токио · с нами {s.day} дн.</span>
            <div className="mm-status">{s.profile.status || 'статус не задан'}</div>
          </div>
        </div>
        <div className="mm-card">
          <h4>Оформление страницы</h4>
          <div className="pad" style={{ display: 'grid', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: '#778', marginBottom: 4 }}>Аватар</div>
              <div className="mm-avatars">
                {AVATARS.map((a, i) => (
                  <img key={a} className={`clickable ${s.profile.avatar === i ? 'active' : ''}`} src={avatar(a, 44)} alt="" onClick={() => save({ avatar: i })} />
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#778', marginBottom: 4 }}>Статус</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="input" style={{ flex: 1 }} value={status} onChange={(e) => setStatus(e.target.value)} placeholder="что у тебя на уме?" maxLength={60} />
                <button className="btn" onClick={() => save({ status })}>
                  Сохранить
                </button>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#778', marginBottom: 4 }}>Песня профиля</div>
              <select className="input" value={s.profile.song} onChange={(e) => save({ song: e.target.value })}>
                <option value="">— не выбрана —</option>
                {SONGS.map((x) => (
                  <option key={x.title} value={`${x.title} — ${x.artist}`}>
                    {x.title} — {x.artist}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#778', marginBottom: 4 }}>Тема</div>
              <button className={`btn ${s.profile.theme === 'sakura' ? 'pink' : ''}`} onClick={() => save({ theme: 'sakura' })}>
                сакура
              </button>{' '}
              <button className={`btn ${s.profile.theme === 'city' ? 'primary' : ''}`} onClick={() => save({ theme: 'city' })}>
                город
              </button>
            </div>
          </div>
        </div>
        <div className="mm-card">
          <h4>Мои записи ({posts.length})</h4>
          {posts.length === 0 && (
            <div className="pad" style={{ color: '#999' }}>
              Записей пока нет.
            </div>
          )}
          {posts.map((p) => (
            <PostView key={p.id} post={p} nav={nav} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Messages({ contact, nav }: { contact?: Contact; nav: Nav }) {
  const s = useGameState();
  const list: Contact[] = ['mayu', ...(s.flags.ren_commented ? (['ren'] as Contact[]) : [])];
  return (
    <div className="mm-body fill">
      <div className="mm-side">
        <div className="mm-card">
          <h4>Диалоги</h4>
          {list.map((c) => {
            const gone = c === 'ren' && s.flags.ren_gone;
            return (
              <div key={c} className="mm-friend clickable" role="button" onClick={() => nav('messages', { contact: c })} style={contact === c ? { background: '#f4e6ee' } : undefined}>
                <img className="av" src={avatar(gone ? 'unknown' : CONTACT_INFO[c].avatar, 28)} alt="" />
                <span style={{ flex: 1 }}>{gone ? 'user not found' : CONTACT_INFO[c].name}</span>
                {s.unread[c] > 0 && <span className="badge" style={{ position: 'static' }}>{s.unread[c]}</span>}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mm-main">
        <div className="mm-card chatcard">
          {contact ? <Chat contact={contact} channel="meromero" /> : <div className="pad" style={{ color: '#999', margin: 'auto' }}>Выбери диалог слева</div>}
        </div>
      </div>
    </div>
  );
}

function UserPage({ user, nav }: { user: string; nav: Nav }) {
  const s = useGameState();
  const isRen = user === 'ren';
  const gone = isRen && s.flags.ren_gone;
  const posts = s.posts.filter((p) => p.author === user).reverse();
  if (gone) {
    return (
      <div className="mm-body">
        <Sidebar nav={nav} />
        <div className="mm-main">
          <div className="mm-card">
            <div className="pad" style={{ textAlign: 'center', padding: 50, color: '#889' }}>
              <div style={{ fontSize: 40, letterSpacing: 4 }}>404</div>
              USER NOT FOUND
              <div style={{ fontSize: 11, marginTop: 8 }}>Страница удалена или никогда не существовала.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="mm-body">
      <Sidebar nav={nav} />
      <div className="mm-main">
        <div className="mm-card">
          <div className="mm-banner" style={{ backgroundImage: `url(/assets/mm/banner-${isRen ? 'city' : 'sakura'}.png)`, filter: isRen ? 'grayscale(0.6) brightness(0.7)' : undefined }}>
            <img className="av" src={avatar(isRen ? 'ren' : 'mayu', 64)} alt="" />
          </div>
          <div className="mm-profile-info">
            <b>{isRen ? 'REN_17' : 'mayu☆'}</b>{' '}
            <span style={{ color: '#889', fontSize: 11 }}>{isRen ? '· 17 · — · с нами 2 г.' : '· 16 · Токио · с нами 1 г.'}</span>
            <div className="mm-status">{isRen ? (s.day >= 5 ? 'не пишите мне днём' : 'ночь — единственное честное время') : 'блинчики ✌🏻 фотик ✌🏻 нана ✌🏻'}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
              <button className="btn" onClick={() => nav('messages', { contact: user as Contact })}>
                Написать
              </button>
              <span style={{ fontSize: 11, color: '#889', alignSelf: 'center' }}>
                <i className={`dot ${(isRen ? s.renOnline : s.mayuOnline) ? 'on' : 'off'}`} /> {(isRen ? s.renOnline : s.mayuOnline) ? 'на сайте' : 'не на сайте'}
              </span>
            </div>
          </div>
        </div>
        <div className="mm-card">
          <h4>Фотографии</h4>
          <div className="pad" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {isRen
              ? [s.flags.ren_photo1 && 'ren_1', s.flags.ren_photo2 && 'ren_2'].filter(Boolean).map((p) => <img key={p as string} src={renderPhoto(p as string, 160, 120)} alt="" style={{ border: '3px solid #fff', boxShadow: '0 0 0 1px #ccd' }} />)
              : ['mayu_1', 'mayu_2', s.flags.photo_cafe && 'cafe_mayu', s.flags.photo_river && 'river_nana'].filter(Boolean).map((p) => <img key={p as string} src={renderPhoto(p as string, 160, 120)} alt="" style={{ border: '3px solid #fff', boxShadow: '0 0 0 1px #ccd' }} />)}
            {isRen && !s.flags.ren_photo1 && <span style={{ color: '#999', fontSize: 12 }}>Фотографий нет. Профиль без лица.</span>}
          </div>
        </div>
        <div className="mm-card">
          <h4>Записи</h4>
          {posts.length === 0 && (
            <div className="pad" style={{ color: '#999' }}>
              {isRen ? 'REN_17 ничего не публикует. Только комментирует.' : 'Записей пока нет.'}
            </div>
          )}
          {posts.map((p) => (
            <PostView key={p.id} post={p} nav={nav} />
          ))}
        </div>
      </div>
    </div>
  );
}
