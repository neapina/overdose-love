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
    setWindowTitle(win.id, p === 'messages' && extra.contact ? `meromero · ${CONTACT_INFO[extra.contact as Contact].name}` : p === 'profile' ? 'meromero · моя страница' : p === 'messages' ? 'meromero · сообщения' : 'meromero');
  }

  if (!registered) return <Register onEnter={() => nav('profile')} />;

  return (
    <div className="mm">
      <div className="mm-top">
        <div className="mm-logo clickable" role="button" onClick={() => nav('feed')}>
          <img src="/assets/icons/meromero.png" alt="" />
          meromero
        </div>
        <div className="mm-tabs">
          <button className={page === 'feed' ? 'active' : ''} onClick={() => nav('feed')}>
            лента
          </button>
          <button className={page === 'profile' ? 'active' : ''} onClick={() => nav('profile')}>
            моя страница
          </button>
          <button className={page === 'messages' ? 'active' : ''} onClick={() => nav('messages')}>
            сообщения
            {unread > 0 && <span className="badge">{unread}</span>}
          </button>
        </div>
        <div className="mm-user">
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
        <div className="mm-counter">
          <b>{s.flags.mm_registered ? 12 + s.day * 7 + Math.round(s.ren * 3) : 0}</b> следов
          <small>кто заходил на страницу{s.flags.ren_known && !gone ? ' · последний: REN_17' : mayuFriend ? ' · последний: mayu☆' : ''}</small>
        </div>
      </div>
      <div className="mm-card">
        <h4>друзья ({(mayuFriend ? 1 : 0) + (renVisible && !gone ? 1 : 0)})</h4>
        {!mayuFriend && (
          <div className="pad" style={{ fontSize: 12, color: '#a08494' }}>
            пока никого
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
        <h4>сейчас на сайте</h4>
        <div className="pad" style={{ fontSize: 12 }}>
          {[nick(s), s.mayuOnline && 'mayu☆', s.renOnline && renVisible && !gone && 'REN_17', 'yuki_02', s.day % 2 ? 'kaori.k' : null].filter(Boolean).join(' · ')}
        </div>
      </div>
      <div className="mm-card">
        <h4>музыка страницы</h4>
        <div className="pad" style={{ fontSize: 12 }}>
          {s.profile.song ? (
            <span>
              ♪ {s.profile.song}
              <br />
              <small style={{ color: '#a08494' }}>прослушиваний: {3 + s.day * 2}</small>
            </span>
          ) : (
            <span style={{ color: '#a08494' }}>— тишина —</span>
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
      <h4>дневник</h4>
      <div className="mm-compose">
        <img src={avatar(AVATARS[s.profile.avatar] ?? 'nana', 40)} alt="" style={{ width: 40, height: 40, borderRadius: 5 }} />
        {!open ? (
          <button className="mm-fakeinput clickable" onClick={() => setOpen(true)}>
            {s.flags.posted ? 'ещё что-нибудь…' : 'первая запись. ну. что-нибудь.'}
          </button>
        ) : (
          <div className="choices quiet" style={{ flex: 1 }}>
            {options.length === 0 && <div className="chat-hint">в голове пусто. потом.</div>}
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
          <h4>лента</h4>
          {posts.length === 0 && (
            <div className="pad" style={{ color: '#a08494' }}>
              тут пока ничего
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
          {12 + post.day}.10 {formatClock(post.time)}
        </span>
        <div className="txt">{post.text}</div>
        {post.photo && <img className="photo" src={renderPhoto(post.photo, 320, 240)} alt="" />}
        <div className="mm-actions">
          <span className={post.author === 'nana' ? '' : 'clickable'} role="button" onClick={like} title={post.likedBy?.length ? post.likedBy.join(', ') : undefined}>
            <img src={liked ? '/assets/mm/heart-small.png' : '/assets/mm/heart-grey.png'} alt="" /> {post.likes}
          </span>
          <span className={opts.length ? 'clickable' : ''} role="button" onClick={() => opts.length && setCommenting((c) => !c)}>
            коммент ({post.comments.length}){opts.length ? ' · ответить' : ''}
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
            <b>{nick(s)}</b> <span style={{ color: '#a08494', fontSize: 11 }}>· 16 · токио · на сайте {s.day} дн.</span>
            <div className="mm-status">{s.profile.status || '…'}</div>
          </div>
        </div>
        <div className="mm-card">
          <h4>моя страница</h4>
          <div className="pad" style={{ display: 'grid', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: '#8a6a7a', marginBottom: 4 }}>аватар</div>
              <div className="mm-avatars">
                {AVATARS.map((a, i) => (
                  <img key={a} className={`clickable ${s.profile.avatar === i ? 'active' : ''}`} src={avatar(a, 44)} alt="" onClick={() => save({ avatar: i })} />
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#8a6a7a', marginBottom: 4 }}>одной строкой</div>
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
              <div style={{ fontSize: 11, color: '#8a6a7a', marginBottom: 4 }}>музыка страницы</div>
              <select className="input" value={s.profile.song} onChange={(e) => save({ song: e.target.value })}>
                <option value="">— тишина —</option>
                {songs.map((x) => (
                  <option key={x.title} value={`${x.title} — ${x.artist}`}>
                    {x.title} — {x.artist}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#8a6a7a', marginBottom: 4 }}>шапка</div>
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
          <h4>записи ({posts.length})</h4>
          {posts.length === 0 && (
            <div className="pad" style={{ color: '#a08494' }}>
              ни одной
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
          <h4>сообщения</h4>
          {list.map((c) => {
            const gone = c === 'ren' && s.flags.ren_gone;
            return (
              <div key={c} className="mm-friend clickable" role="button" onClick={() => nav('messages', { contact: c })} style={contact === c ? { background: '#fde9f1' } : undefined}>
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
            <div className="pad" style={{ color: '#a08494', margin: 'auto', textAlign: 'center', fontFamily: 'var(--pixel)' }}>
              {list.length ? '← кого-нибудь выбери' : 'никто пока не писал'}
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
            <div className="pad" style={{ textAlign: 'center', padding: 50, color: '#8a6a7a', fontFamily: 'var(--pixel)' }}>
              <div style={{ fontSize: 40, letterSpacing: 4 }}>404</div>
              user not found
              <div style={{ fontSize: 11, marginTop: 8, color: '#b39aa6' }}>страницы нет. может, и не было.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  const status = isRen ? (s.day >= 5 ? 'днём не пишите' : 'ночью тут тише') : isMayu ? 'блинчики ✌ фотик ✌ нана ✌' : 'как убрать автоплей?? кто-нибудь';
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
            <span style={{ color: '#a08494', fontSize: 11 }}>{isRen ? '· 17 · — · на сайте 2 г.' : isMayu ? '· 16 · токио · на сайте 1 г.' : '· 15 · осака'}</span>
            <div className="mm-status">{status}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
              {(isRen || isMayu) && (
                <button className="btn" onClick={() => nav('messages', { contact: user as Contact })}>
                  написать
                </button>
              )}
              <span style={{ fontSize: 11, color: '#a08494', alignSelf: 'center' }}>
                <i className={`dot ${online ? 'on' : 'off'}`} /> {online ? 'на сайте' : 'не на сайте'}
              </span>
            </div>
          </div>
        </div>
        {(isRen || isMayu) && (
          <div className="mm-card">
            <h4>фото</h4>
            <div className="pad" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(isRen
                ? [s.flags.ren_photo1 && 'ren_1', s.flags.ren_photo2 && 'ren_2']
                : ['mayu_1', 'mayu_2', s.flags.photo_cafe && 'cafe_mayu', s.flags.photo_river && 'river_nana']
              )
                .filter((p): p is string => typeof p === 'string')
                .map((p) => <img key={p} src={renderPhoto(p, 160, 120)} alt="" style={{ border: '3px solid #fff', boxShadow: '0 0 0 1px #e3c4d2' }} />)}
              {isRen && !s.flags.ren_photo1 && <span style={{ color: '#a08494', fontSize: 12 }}>ни одной. вообще.</span>}
            </div>
          </div>
        )}
        <div className="mm-card">
          <h4>записи</h4>
          {posts.length === 0 && (
            <div className="pad" style={{ color: '#a08494' }}>
              {isRen ? 'ничего. только комментирует чужое.' : 'пока пусто'}
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

function Register({ onEnter }: { onEnter: () => void }) {
  const s = useGameState();
  const [step, setStep] = useState<RegStep>('landing');
  const [nickIdx, setNickIdx] = useState<number | null>(null);
  const [captcha, setCaptcha] = useState(false);
  const [av, setAv] = useState(0);
  const [theme, setTheme] = useState<'sakura' | 'city'>('sakura');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (step === 'account') think('ник. просто nana занят, конечно. ну кто бы сомневался');
    if (step === 'look') think('аватарка. маю скажет «поставь розовое». посмотрим');
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
      toast('meromero', `${NICKS[nickIdx ?? 0]} — страница создана ✧`, '/assets/icons/meromero.png', { app: 'meromero', props: { page: 'profile' } });
      think(s.clock < 19 * 60 + 30 ? 'всё. есть страница. маю сказала, вечером найдёт. ну, жду' : 'всё. есть страница. маю сказала, что сама найдёт');
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
        <div className="mm-user">meromero.net · 2011 · β</div>
      </div>
      <div className="mm-reg-body">
        {step === 'landing' && (
          <>
            <div className="mm-card mm-reg-card">
              <div className="mm-reg-hero">
                <img src="/assets/icons/meromero.png" alt="" />
                <h2>meromero</h2>
                <p>твоя страница. твоя музыка. свои люди.</p>
              </div>
              <div className="mm-reg-actions">
                <button className="btn pink" onClick={() => go('account')}>
                  создать страницу
                </button>
                <button className="btn" disabled title="у Наны ещё нет страницы">
                  войти
                </button>
              </div>
              <div className="mm-reg-foot">сейчас на сайте: 1 204 · сегодня новых: 37</div>
            </div>
            <div className="mm-card mm-news">
              <h4>новости сайта</h4>
              <div className="pad">
                <div>
                  <b>10.12</b>музыка страницы ♪ — теперь можно поставить трек
                </div>
                <div>
                  <b>10.03</b>новая шапка: «город» (ночная)
                </div>
                <div>
                  <b>09.30</b>нам два года ✧ спасибо, что вы тут
                </div>
                <div>
                  <b>09.14</b>починили следы. кто заходил — видно снова
                </div>
              </div>
            </div>
          </>
        )}
        {step === 'account' && (
          <div className="mm-card mm-reg-card">
            <h4>шаг 1 из 2 — кто ты</h4>
            <div className="pad mm-form">
              <label>ник</label>
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
              <label>e-mail</label>
              <input className="input" value="nana.k@ymail.jp" readOnly />
              <label>пароль</label>
              <input className="input" type="password" value="sakura" readOnly />
              <small className="mm-note">тот же, что от компа. да, знаю.</small>
              <label>дата рождения</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="input" value="14" readOnly style={{ width: 50 }} />
                <input className="input" value="март" readOnly style={{ width: 90 }} />
                <input className="input" value="1995" readOnly style={{ width: 70 }} />
              </div>
              <label>ты не робот?</label>
              <div className="mm-captcha">
                <span className="mm-captcha-img">m3r0</span>
                {captcha ? <input className="input" value="m3r0" readOnly style={{ width: 90 }} /> : <button className="btn" onClick={() => (playSound('click'), setCaptcha(true))}>ввести</button>}
              </div>
            </div>
            <div className="mm-reg-actions">
              <button className="btn" onClick={() => go('landing')}>
                назад
              </button>
              <button className="btn pink" disabled={nickIdx === null || !captcha} onClick={() => go('look')}>
                дальше →
              </button>
            </div>
          </div>
        )}
        {step === 'look' && (
          <div className="mm-card mm-reg-card">
            <h4>шаг 2 из 2 — как выглядишь</h4>
            <div className="pad mm-form">
              <label>аватар</label>
              <div className="mm-avatars">
                {AVATARS.map((a, i) => (
                  <img key={a} className={`clickable ${av === i ? 'active' : ''}`} src={avatar(a, 44)} alt="" onClick={() => (playSound('click'), setAv(i))} />
                ))}
              </div>
              <label>шапка</label>
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
                  <div style={{ fontSize: 11, color: '#a08494' }}>16 · токио · новенькая</div>
                </div>
              </div>
            </div>
            <div className="mm-reg-actions">
              <button className="btn" onClick={() => go('account')}>
                назад
              </button>
              <button className="btn pink" disabled={busy} onClick={finish}>
                {busy ? 'секунду…' : 'создать страницу'}
              </button>
            </div>
          </div>
        )}
        {step === 'done' && (
          <div className="mm-card mm-reg-card">
            <div className="mm-reg-hero">
              <img className="av" src={avatar(AVATARS[av], 64)} alt="" style={{ borderRadius: 6 }} />
              <h2>привет, {NICKS[nickIdx ?? 0]} ✧</h2>
              <p>страница есть. друзей 0. следов 0. пока.</p>
            </div>
            <div className="mm-reg-actions">
              <button
                className="btn pink"
                onClick={() => {
                  setState((st) => ({ flags: { ...st.flags, mm_entered: true } }));
                  onEnter();
                }}
              >
                на мою страницу →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
