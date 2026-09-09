import { useEffect, useState } from 'react';
import { formatClock, setState, think, toast, useGameState, type Contact, type GameState, type Post, type WindowState } from '../state/store';
import { setWindowTitle } from '../state/windows';
import { addComment, addPost } from '../story/engine';
import { avatar } from '../story/avatars';
import { renderPhoto } from '../story/photos';
import { playSound } from '../os/sounds';
import { Chat } from './Chat';
import { CONTACT_INFO } from './contacts';
import { REN_SONG, SONGS } from '../story/fs';
import { commentOptions, postOptions, replyOptions, statusOptions, type CommentOption } from '../story/social';

type Page = 'feed' | 'profile' | 'messages' | 'user';

const AVATARS = ['nana', 'nana2', 'yuki', 'kaori'];
const NICKS = ['nana', 'nana_k', 'nanaaa', 'n_a_n_a', 'nana.exe'];

const NAMES: Record<string, string> = { mayu: 'mayu☆', ren: 'REN_17' };
const nick = (s: GameState) => s.profile.nick || 'nana';
const displayName = (author: string, s: GameState) => (author === 'nana' ? nick(s) : NAMES[author] ?? author);
const authorAvatar = (author: string, nanaAvatar: number) =>
  author === 'nana' ? AVATARS[nanaAvatar] ?? 'nana' : author === 'mayu' ? 'mayu' : author === 'ren' ? 'ren' : author === 'yuki_02' ? 'yuki' : author === 'kaori.k' ? 'kaori' : 'unknown';
const userIdFor = (name: string) => (name === 'REN_17' ? 'ren' : name === 'mayu☆' ? 'mayu' : name);

export function Meromero({ win }: { win: WindowState }) {
  const s = useGameState();
  const page = (win.props?.page as Page | undefined) ?? 'feed';
  const contact = win.props?.contact as Contact | undefined;
  const user = win.props?.user as string | undefined;
  const unread = s.unread.ren + s.unread.mayu;
  const registered = !!s.flags.mm_registered && !!s.flags.mm_entered;

  useEffect(() => {
    if (!s.flags.mm_registered) return;
    setState((st) =>
      st.flags.mm_seeded
        ? {}
        : {
            flags: { ...st.flags, mm_seeded: true },
            posts: [
              { id: 'seed_kaori', author: 'kaori.k', text: 'новые наушники ✧ теперь никто не мешает', day: st.day, time: st.clock - 190, likes: 6, comments: [{ author: 'yuki_02', text: 'какие??' }], likedBy: [] },
              { id: 'seed_yuki', author: 'yuki_02', text: 'кто-нибудь знает как убрать музыку с автоплеем со страницы?? помогите', day: st.day, time: st.clock - 40, likes: 10, comments: [], likedBy: [] },
              ...st.posts,
            ],
          }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.flags.mm_registered]);

  function nav(p: Page, extra: Record<string, unknown> = {}) {
    playSound('click');
    setState((st) => ({ windows: st.windows.map((w) => (w.id === win.id ? { ...w, props: { ...w.props, page: p, contact: undefined, user: undefined, ...extra } } : w)) }));
    setWindowTitle(win.id, p === 'messages' && extra.contact ? `meromero · ${CONTACT_INFO[extra.contact as Contact].name}` : p === 'profile' ? 'meromero · моя страница' : 'meromero');
  }

  if (!registered) return <Register />;

  return (
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
            {unread > 0 && <span className="badge">{unread}</span>}
          </button>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#7a4a5e' }}>
          <i className="dot on" /> {nick(s)}
        </div>
      </div>
      {page === 'feed' && <Feed nav={nav} />}
      {page === 'profile' && <Profile nav={nav} />}
      {page === 'messages' && <Messages contact={contact} nav={nav} />}
      {page === 'user' && <UserPage user={user ?? 'mayu'} nav={nav} />}
    </div>
  );
}

type Nav = (p: Page, extra?: Record<string, unknown>) => void;

function Sidebar({ nav }: { nav: Nav }) {
  const s = useGameState();
  const gone = !!s.flags.ren_gone;
  const renVisible = !!s.flags.ren_known;
  const mayuFriend = !!s.flags.mayu_friend;
  return (
    <div className="mm-side">
      <div className="mm-card">
        <h4>Друзья ({(mayuFriend ? 1 : 0) + (renVisible && !gone ? 1 : 0)})</h4>
        {!mayuFriend && (
          <div className="pad" style={{ fontSize: 12, color: '#999' }}>
            Пока никого. Друзья найдут тебя по нику.
          </div>
        )}
        {mayuFriend && (
          <div className="mm-friend clickable" role="button" onClick={() => nav('user', { user: 'mayu' })}>
            <img className="av" src={avatar('mayu', 28)} alt="" />
            <span>
              <i className={`dot ${s.mayuOnline ? 'on' : 'off'}`} /> mayu☆
            </span>
          </div>
        )}
        {renVisible && (
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
          {[nick(s), s.mayuOnline && 'mayu☆', s.renOnline && renVisible && !gone && 'REN_17', 'yuki_02', s.day % 2 ? 'kaori.k' : null].filter(Boolean).join(' · ')}
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

function Compose() {
  const s = useGameState();
  const [open, setOpen] = useState(false);
  const options = postOptions(s);
  return (
    <div className="mm-card">
      <h4>Что нового?</h4>
      <div className="mm-compose">
        <img src={avatar(AVATARS[s.profile.avatar] ?? 'nana', 40)} alt="" style={{ width: 40, height: 40, borderRadius: 5 }} />
        {!open ? (
          <button className="mm-fakeinput clickable" onClick={() => setOpen(true)}>
            {s.flags.posted ? 'написать ещё…' : 'первая запись… ну хоть «привет»'}
          </button>
        ) : (
          <div className="choices quiet" style={{ flex: 1 }}>
            {options.length === 0 && <div className="chat-hint">Нане пока нечего написать.</div>}
            {options.map((o) => (
              <button
                key={o.text}
                className="choice"
                onClick={() => {
                  addPost('nana', o.text, o.photo);
                  playSound('notify');
                  setState((st) => ({
                    flags: { ...st.flags, posted: true, ...Object.fromEntries((o.flags ?? []).map((f) => [f, true])) },
                    mayu: st.mayu + (o.mayu ?? 0),
                    ren: st.ren + (o.ren ?? 0),
                  }));
                  setOpen(false);
                }}
              >
                {o.photo && <span className="tag">📷</span>}
                {o.text}
              </button>
            ))}
            <button className="choice muted" onClick={() => setOpen(false)}>
              передумала
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Feed({ nav }: { nav: Nav }) {
  const s = useGameState();
  const posts = [...s.posts].reverse();
  return (
    <div className="mm-body">
      <Sidebar nav={nav} />
      <div className="mm-main">
        <Compose />
        <div className="mm-card">
          <h4>Лента</h4>
          {posts.length === 0 && (
            <div className="pad" style={{ color: '#999' }}>
              Пока пусто.
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

function PostView({ post, nav }: { post: Post; nav: Nav }) {
  const s = useGameState();
  const [commenting, setCommenting] = useState(false);
  const liked = (post.likedBy ?? []).includes('nana');
  const opts = post.author === 'nana' ? replyOptions(post, s) : commentOptions(post, s);

  function like() {
    if (liked || post.author === 'nana') return;
    playSound('click');
    setState((st) => ({
      posts: st.posts.map((p) => (p.id === post.id ? { ...p, likes: p.likes + 1, likedBy: [...(p.likedBy ?? []), 'nana'] } : p)),
      mayu: st.mayu + (post.author === 'mayu' ? 0.5 : 0),
      ren: st.ren + (post.author === 'ren' ? 0.5 : 0),
    }));
  }

  function comment(o: CommentOption) {
    playSound('click');
    addComment(post.id, 'nana', o.text.replace(/^\[[^\]]*\]\s*/, ''));
    setState((st) => ({
      mayu: st.mayu + (o.mayu ?? 0),
      ren: st.ren + (o.ren ?? 0),
      flags: { ...st.flags, ...Object.fromEntries((o.flags ?? []).map((f) => [f, true])) },
    }));
    setCommenting(false);
    if (o.reply) {
      const author = post.author === 'nana' ? post.comments.at(-1)?.author ?? 'mayu☆' : displayName(post.author, s);
      const reply = o.reply;
      setTimeout(() => {
        addComment(post.id, author, reply);
        playSound('notify');
      }, 2500 + (reply.length % 5) * 500);
    }
  }

  return (
    <div className="mm-post">
      <img className="av clickable" src={avatar(authorAvatar(post.author, s.profile.avatar), 40)} alt="" onClick={() => post.author !== 'nana' && nav('user', { user: post.author })} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <span className={`who ${post.author}`}>{displayName(post.author, s)}</span>
        <span className="when">
          день {post.day} · {formatClock(post.time)}
        </span>
        <div className="txt">{post.text}</div>
        {post.photo && <img className="photo" src={renderPhoto(post.photo, 320, 240)} alt="" />}
        <div className="mm-actions">
          <span className={post.author === 'nana' ? '' : 'clickable'} role="button" onClick={like} title={post.likedBy?.length ? post.likedBy.join(', ') : undefined}>
            <img src={liked ? '/assets/mm/heart-small.png' : '/assets/mm/heart-grey.png'} alt="" /> {post.likes}
          </span>
          <span className={opts.length ? 'clickable' : ''} role="button" onClick={() => opts.length && setCommenting((c) => !c)}>
            комментарии ({post.comments.length}){opts.length ? ' · написать' : ''}
          </span>
        </div>
        {post.comments.map((c, i) => (
          <div key={i} className={`mm-comment ${c.author === 'nana' ? 'mine' : ''}`}>
            <b className="clickable" onClick={() => c.author !== 'nana' && nav('user', { user: userIdFor(c.author) })}>
              {displayName(c.author, s)}
            </b>
            : {c.text}
          </div>
        ))}
        {commenting && opts.length > 0 && (
          <div className="choices quiet">
            {opts.map((o) => (
              <button key={o.text} className={`choice ${o.text.startsWith('[') ? 'muted' : ''}`} onClick={() => comment(o)}>
                {o.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Profile({ nav }: { nav: Nav }) {
  const s = useGameState();
  const posts = s.posts.filter((p) => p.author === 'nana').reverse();
  const statuses = statusOptions(s);
  const songs = [...SONGS, ...(s.flags.ren_song ? [REN_SONG] : [])];

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
            <b>{nick(s)}</b> <span style={{ color: '#889', fontSize: 11 }}>· 16 · Токио · с нами {s.day} дн.</span>
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
              <div className="mm-statuses">
                {statuses.map((o) => (
                  <button key={o.key} className={`chip ${s.profile.status === o.text ? 'active' : ''} ${o.key === 'die' || o.key === 'nobody' || o.key === 'empty' ? 'dark' : ''}`} onClick={() => save({ status: o.text })}>
                    {o.text}
                  </button>
                ))}
                {s.profile.status && (
                  <button className="chip muted" onClick={() => save({ status: '' })}>
                    убрать
                  </button>
                )}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#778', marginBottom: 4 }}>Песня профиля</div>
              <select className="input" value={s.profile.song} onChange={(e) => save({ song: e.target.value })}>
                <option value="">— не выбрана —</option>
                {songs.map((x) => (
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
  const list: Contact[] = [...(s.flags.mayu_friend ? (['mayu'] as Contact[]) : []), ...(s.flags.ren_known ? (['ren'] as Contact[]) : [])];
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
          {contact ? (
            <Chat contact={contact} />
          ) : (
            <div className="pad" style={{ color: '#999', margin: 'auto', textAlign: 'center' }}>
              {list.length ? 'Выбери диалог слева' : 'Диалогов пока нет. Никто ещё не написал.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UserPage({ user, nav }: { user: string; nav: Nav }) {
  const s = useGameState();
  const isRen = user === 'ren';
  const isMayu = user === 'mayu';
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
  const status = isRen ? (s.day >= 5 ? 'не пишите мне днём' : 'ночь — единственное честное время') : isMayu ? 'блинчики ✌🏻 фотик ✌🏻 нана ✌🏻' : 'помогите убрать автоплей';
  const online = isRen ? s.renOnline : isMayu ? s.mayuOnline : true;
  return (
    <div className="mm-body">
      <Sidebar nav={nav} />
      <div className="mm-main">
        <div className="mm-card">
          <div className="mm-banner" style={{ backgroundImage: `url(/assets/mm/banner-${isRen ? 'city' : 'sakura'}.png)`, filter: isRen ? 'grayscale(0.6) brightness(0.7)' : undefined }}>
            <img className="av" src={avatar(authorAvatar(user, 0), 64)} alt="" />
          </div>
          <div className="mm-profile-info">
            <b>{displayName(user, s)}</b>{' '}
            <span style={{ color: '#889', fontSize: 11 }}>{isRen ? '· 17 · — · с нами 2 г.' : isMayu ? '· 16 · Токио · с нами 1 г.' : '· 15 · Осака'}</span>
            <div className="mm-status">{status}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
              {(isRen || isMayu) && (
                <button className="btn" onClick={() => nav('messages', { contact: user as Contact })}>
                  Написать
                </button>
              )}
              <span style={{ fontSize: 11, color: '#889', alignSelf: 'center' }}>
                <i className={`dot ${online ? 'on' : 'off'}`} /> {online ? 'на сайте' : 'не на сайте'}
              </span>
            </div>
          </div>
        </div>
        {(isRen || isMayu) && (
          <div className="mm-card">
            <h4>Фотографии</h4>
            <div className="pad" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(isRen
                ? [s.flags.ren_photo1 && 'ren_1', s.flags.ren_photo2 && 'ren_2']
                : ['mayu_1', 'mayu_2', s.flags.photo_cafe && 'cafe_mayu', s.flags.photo_river && 'river_nana']
              )
                .filter((p): p is string => typeof p === 'string')
                .map((p) => <img key={p} src={renderPhoto(p, 160, 120)} alt="" style={{ border: '3px solid #fff', boxShadow: '0 0 0 1px #ccd' }} />)}
              {isRen && !s.flags.ren_photo1 && <span style={{ color: '#999', fontSize: 12 }}>Фотографий нет. Профиль без лица.</span>}
            </div>
          </div>
        )}
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

// ───────────────────────── регистрация ─────────────────────────

type RegStep = 'landing' | 'account' | 'look' | 'done';

function Register() {
  const s = useGameState();
  const [step, setStep] = useState<RegStep>('landing');
  const [nickIdx, setNickIdx] = useState<number | null>(null);
  const [captcha, setCaptcha] = useState(false);
  const [av, setAv] = useState(0);
  const [theme, setTheme] = useState<'sakura' | 'city'>('sakura');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (step === 'account') think('ник. как в «моём» хочется «nana», но он наверняка занят. занят? посмотрим.');
    if (step === 'look') think('аватар. маю скажет «поставь розовое». подумаю.');
  }, [step]);

  function go(next: RegStep) {
    playSound('click');
    setStep(next);
  }

  function finish() {
    setBusy(true);
    playSound('click');
    setTimeout(() => {
      setState((st) => ({
        profile: { ...st.profile, nick: NICKS[nickIdx ?? 0], avatar: av, theme },
        flags: { ...st.flags, mm_registered: true },
      }));
      playSound('notify');
      toast('meromero', `Страница ${NICKS[nickIdx ?? 0]} создана. Добро пожаловать!`, '/assets/icons/meromero.png', { app: 'meromero', props: { page: 'profile' } });
      think(s.clock < 19 * 60 + 30 ? 'всё. я в сети. теперь ждать, пока маю меня найдёт. она обещала вечером.' : 'всё. я в сети. маю обещала найти меня сама.');
      setBusy(false);
      setStep('done');
    }, 1800);
  }

  return (
    <div className="mm mm-reg">
      <div className="mm-top">
        <div className="mm-logo">
          <img src="/assets/icons/meromero.png" alt="" />
          meromero
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#889' }}>meromero.net · 2011 · beta</div>
      </div>
      <div className="mm-reg-body">
        {step === 'landing' && (
          <div className="mm-card mm-reg-card">
            <div className="mm-reg-hero">
              <img src="/assets/icons/meromero.png" alt="" />
              <h2>место, где тихо</h2>
              <p>страница, друзья, музыка профиля, сообщения. без лишнего.</p>
            </div>
            <div className="mm-reg-actions">
              <button className="btn pink" onClick={() => go('account')}>
                Создать страницу
              </button>
              <button className="btn" disabled title="У Наны ещё нет страницы">
                Войти
              </button>
            </div>
            <div className="mm-reg-foot">сейчас на сайте: 1 204 · новых сегодня: 37</div>
          </div>
        )}
        {step === 'account' && (
          <div className="mm-card mm-reg-card">
            <h4>Шаг 1 из 2 — учётная запись</h4>
            <div className="pad mm-form">
              <label>Ник</label>
              <div className="mm-statuses">
                {NICKS.map((n, i) => {
                  const taken = i === 0;
                  return (
                    <button key={n} className={`chip ${nickIdx === i ? 'active' : ''} ${taken ? 'muted' : ''}`} onClick={() => !taken && (playSound('click'), setNickIdx(i))} title={taken ? 'занят' : undefined}>
                      {n}
                      {taken && <small> · занят</small>}
                    </button>
                  );
                })}
              </div>
              <label>E-mail</label>
              <input className="input" value="nana.k@ymail.jp" readOnly />
              <label>Пароль</label>
              <input className="input" type="password" value="sakura" readOnly />
              <small className="mm-note">тот же, что от компьютера. плохая идея. знаю.</small>
              <label>Дата рождения</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="input" value="14" readOnly style={{ width: 50 }} />
                <input className="input" value="март" readOnly style={{ width: 90 }} />
                <input className="input" value="1995" readOnly style={{ width: 70 }} />
              </div>
              <label>Проверка</label>
              <div className="mm-captcha">
                <span className="mm-captcha-img">m3r0</span>
                {captcha ? <input className="input" value="m3r0" readOnly style={{ width: 90 }} /> : <button className="btn" onClick={() => (playSound('click'), setCaptcha(true))}>ввести</button>}
              </div>
            </div>
            <div className="mm-reg-actions">
              <button className="btn" onClick={() => go('landing')}>
                Назад
              </button>
              <button className="btn pink" disabled={nickIdx === null || !captcha} onClick={() => go('look')}>
                Дальше →
              </button>
            </div>
          </div>
        )}
        {step === 'look' && (
          <div className="mm-card mm-reg-card">
            <h4>Шаг 2 из 2 — как ты выглядишь</h4>
            <div className="pad mm-form">
              <label>Аватар</label>
              <div className="mm-avatars">
                {AVATARS.map((a, i) => (
                  <img key={a} className={`clickable ${av === i ? 'active' : ''}`} src={avatar(a, 44)} alt="" onClick={() => (playSound('click'), setAv(i))} />
                ))}
              </div>
              <label>Тема страницы</label>
              <div className="mm-themes">
                {(['sakura', 'city'] as const).map((t) => (
                  <div key={t} className={`mm-theme clickable ${theme === t ? 'active' : ''}`} role="button" onClick={() => (playSound('click'), setTheme(t))} style={{ backgroundImage: `url(/assets/mm/banner-${t}.png)` }}>
                    <span>{t === 'sakura' ? 'сакура' : 'город'}</span>
                  </div>
                ))}
              </div>
              <div className="mm-preview">
                <img className="av" src={avatar(AVATARS[av], 40)} alt="" />
                <div>
                  <b>{NICKS[nickIdx ?? 0]}</b>
                  <div style={{ fontSize: 11, color: '#889' }}>16 · Токио · новичок</div>
                </div>
              </div>
            </div>
            <div className="mm-reg-actions">
              <button className="btn" onClick={() => go('account')}>
                Назад
              </button>
              <button className="btn pink" disabled={busy} onClick={finish}>
                {busy ? 'Создаём страницу…' : 'Создать страницу'}
              </button>
            </div>
          </div>
        )}
        {step === 'done' && (
          <div className="mm-card mm-reg-card">
            <div className="mm-reg-hero">
              <img className="av" src={avatar(AVATARS[av], 64)} alt="" style={{ borderRadius: 6 }} />
              <h2>добро пожаловать, {NICKS[nickIdx ?? 0]}</h2>
              <p>страница создана. друзей пока нет — но это дело времени.</p>
            </div>
            <div className="mm-reg-actions">
              <button className="btn pink" onClick={() => setState((st) => ({ flags: { ...st.flags, mm_entered: true } }))}>
                На мою страницу →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
