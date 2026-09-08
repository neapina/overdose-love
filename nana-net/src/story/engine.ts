import { CONFIG } from '../config';
import { getState, isNight, setState, toast, type ChatMessage, type Contact } from '../state/store';
import { playSound } from '../os/sounds';
import { CONVERSATIONS } from './content';
import type { ChoiceOption, Conversation, Step } from './types';

let queue: Step[] = [];
let currentConv: Conversation | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let tickHandle: ReturnType<typeof setInterval> | null = null;

export const CONTACT_NAME: Record<Contact, string> = { ren: 'REN_17', mayu: 'mayu☆' };

export function chatWindowOpenFor(contact: Contact) {
  const s = getState();
  return s.windows.some((w) => {
    if (w.minimized) return false;
    if (w.app === 'messenger') return w.props?.contact === contact;
    if (w.app === 'meromero') return w.props?.page === 'messages' && w.props?.contact === contact;
    return false;
  });
}

export function activeContact(): Contact | null {
  return currentConv?.contact ?? null;
}

export function pushMessage(m: Omit<ChatMessage, 'id' | 'day' | 'time' | 'contact'> & { contact?: Contact }) {
  const s = getState();
  const contact: Contact = m.contact ?? (m.from === 'ren' || m.from === 'mayu' ? m.from : currentConv?.contact ?? 'mayu');
  const msg: ChatMessage = { ...m, contact, id: s.nextMessageId, day: s.day, time: s.clock };
  const unread = { ...s.unread };
  if ((m.from === 'ren' || m.from === 'mayu') && !chatWindowOpenFor(m.from)) {
    unread[m.from] += 1;
  }
  if (m.from === 'ren' && isNight(s)) setState({ ren: s.ren + 0.1 });
  setState({ messages: [...s.messages, msg], nextMessageId: s.nextMessageId + 1, unread });
  if (m.from === 'ren' || m.from === 'mayu') {
    playSound('message');
    if (!chatWindowOpenFor(m.from)) {
      toast(m.channel === 'messenger' ? 'M Messenger' : 'meromero', `${CONTACT_NAME[m.from]}: ${m.text}`, '/assets/mm/notif-chat.png');
    }
  }
}

export function markRead(contact: Contact) {
  setState((s) => ({ unread: { ...s.unread, [contact]: 0 } }));
}

function schedule(ms: number, fn: () => void) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(fn, ms);
}

function typingDelay(text: string) {
  return Math.min(4500, 700 + text.length * 35);
}

function setTyping(contact: Contact, on: boolean) {
  if (contact === 'ren') setState({ renTyping: on });
  else setState({ mayuTyping: on });
}

function runNext() {
  const s = getState();
  if (s.phase !== 'desktop') {
    schedule(500, runNext);
    return;
  }
  const step = queue.shift();
  if (!step) {
    if (currentConv) {
      const id = currentConv.id;
      setState((st) => ({
        seenConversations: id.startsWith('idle_') ? st.seenConversations : [...st.seenConversations, id],
        activeConversation: null,
        renTyping: false,
        mayuTyping: false,
      }));
      currentConv = null;
    }
    return;
  }
  const conv = currentConv!;
  switch (step.type) {
    case 'msg': {
      if (step.from === 'ren' || step.from === 'mayu') {
        const from = step.from;
        setTyping(from, true);
        schedule(step.delay ?? typingDelay(step.text), () => {
          setTyping(from, false);
          pushMessage({ from, text: step.text, photo: step.photo, channel: conv.channel });
          runNext();
        });
      } else {
        pushMessage({ from: step.from, text: step.text, photo: step.photo, channel: conv.channel });
        schedule(step.from === 'system' ? 1200 : 600, runNext);
      }
      break;
    }
    case 'choice': {
      lastChoice = step;
      setState({ pendingChoice: { conversation: conv.id, step: 0 } });
      if (!chatWindowOpenFor(conv.contact)) {
        toast(conv.channel === 'messenger' ? 'M Messenger' : 'meromero', `${CONTACT_NAME[conv.contact]} ждёт ответа…`, '/assets/mm/notif-chat.png');
      }
      // wait for chooseOption()
      break;
    }
    case 'set': {
      applyEffects(step);
      runNext();
      break;
    }
    case 'status': {
      setContactStatus(step.contact, step.online);
      schedule(800, runNext);
      break;
    }
    case 'pause':
      schedule(step.ms, runNext);
      break;
    case 'toast':
      toast(step.title, step.text, step.icon);
      playSound('notify');
      schedule(800, runNext);
      break;
    case 'comment': {
      commentOnLatest(step.author, step.text);
      schedule(600, runNext);
      break;
    }
    case 'like': {
      likeLatest(step.author);
      schedule(600, runNext);
      break;
    }
    case 'post': {
      addPost(step.author, step.text, step.photo);
      schedule(600, runNext);
      break;
    }
    case 'wallpaper':
      setState({ wallpaper: step.value });
      runNext();
      break;
    case 'end':
      setState({ ending: step.ending, phase: 'ending', activeConversation: null, pendingChoice: null });
      playSound('logoff');
      break;
  }
}

function applyEffects(e: { ren?: number; mayu?: number; flags?: string[] }) {
  setState((st) => ({
    ren: st.ren + (e.ren ?? 0),
    mayu: st.mayu + (e.mayu ?? 0),
    flags: { ...st.flags, ...Object.fromEntries((e.flags ?? []).map((f) => [f, true])) },
  }));
}

export function setContactStatus(contact: Contact, online: boolean) {
  const s = getState();
  if (contact === 'ren') {
    if (s.renOnline !== online) {
      setState({ renOnline: online, renTyping: false });
      if (s.flags.ren_known) {
        playSound(online ? 'online' : 'offline');
        if (online) toast('M Messenger', 'REN_17 — в сети', '/assets/mm/dot-green.png');
      }
    }
  } else if (s.mayuOnline !== online) {
    setState({ mayuOnline: online, mayuTyping: false });
  }
}

export function addPost(author: string, text: string, photo?: string) {
  const s = getState();
  setState({
    posts: [
      ...s.posts,
      { id: `${author}_${s.day}_${s.posts.length}`, author, text, day: s.day, time: s.clock, likes: author === 'nana' ? 0 : 3 + ((s.posts.length * 7) % 9), photo, comments: [], likedBy: [] },
    ],
  });
}

export function addComment(postId: string, author: string, text: string) {
  setState((st) => ({
    posts: st.posts.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, { author, text }] } : p)),
  }));
}

function latestNanaPost() {
  const posts = getState().posts;
  return [...posts].reverse().find((p) => p.author === 'nana') ?? null;
}

function commentOnLatest(author: string, text: string) {
  const p = latestNanaPost();
  if (!p) return;
  addComment(p.id, author, text);
  playSound('notify');
  toast('meromero', `${author} прокомментировал(а) твою запись`, '/assets/mm/notif-chat.png');
}

function likeLatest(author: string) {
  const p = latestNanaPost();
  if (!p) return;
  setState((st) => ({
    posts: st.posts.map((x) => (x.id === p.id ? { ...x, likes: x.likes + 1, likedBy: [...(x.likedBy ?? []), author] } : x)),
  }));
  playSound('notify');
  toast('meromero', `${author} нравится твоя запись`, '/assets/mm/heart-small.png');
}

let lastChoice: Extract<Step, { type: 'choice' }> | null = null;

export function getPendingChoice() {
  return lastChoice;
}

export function chooseOption(index: number) {
  const s = getState();
  if (!s.pendingChoice || !currentConv) return;
  const choice = lastChoice;
  if (!choice) return;
  const opt = choice.options[index];
  if (!opt) return;
  setState({ pendingChoice: null });
  applyEffects(opt);
  const photo = opt.photo === 'webcam_last' ? `webcam_${Math.max(1, s.photosTaken)}` : opt.photo;
  pushMessage({ from: 'nana', text: opt.text.replace(/^\[[^\]]*\]\s*/, '') || opt.text, photo, channel: currentConv.channel });
  if (opt.then) queue.unshift(...opt.then);
  lastChoice = null;
  schedule(500, runNext);
}

/** Nana says a canned line outside of a story conversation; contact replies with `then`. */
export function sayIdle(contact: Contact, opt: ChoiceOption, channel: 'meromero' | 'messenger') {
  if (currentConv) return;
  applyEffects(opt);
  pushMessage({ from: 'nana', contact, text: opt.text, channel });
  if (!opt.then?.length) return;
  currentConv = { id: `idle_${contact}_${Date.now()}`, contact, channel, steps: [] };
  queue = [...opt.then];
  setState({ activeConversation: currentConv.id });
  schedule(600, runNext);
}

function startConversation(conv: Conversation) {
  currentConv = conv;
  queue = [...conv.steps];
  setState({ activeConversation: conv.id });
  runNext();
}

// ---- clock & scheduler

function tick() {
  const s = getState();
  if (s.phase !== 'desktop') return;
  const clock = s.clock + CONFIG.clockSpeed;
  setState({ clock });

  if (clock >= CONFIG.forceSleepMinutes && !s.activeConversation && !s.pendingChoice) {
    forceSleep();
    return;
  }

  if (!currentConv && !s.pendingChoice) {
    const candidate = CONVERSATIONS.find(
      (c) =>
        (c.day === undefined || c.day === s.day) &&
        (c.at === undefined || c.at <= clock) &&
        !s.seenConversations.includes(c.id) &&
        (!c.when || c.when(s)),
    );
    if (candidate) startConversation(candidate);
  }
}

export function startEngine() {
  if (tickHandle) return;
  tickHandle = setInterval(tick, 1000);
}

export function stopEngine() {
  if (tickHandle) clearInterval(tickHandle);
  tickHandle = null;
  if (timer) clearTimeout(timer);
  timer = null;
}

let sleeping = false;
export function forceSleep() {
  if (sleeping) return;
  sleeping = true;
  toast('Seven', 'Нана уснула за компьютером.', '/assets/mm/moon.png');
  setTimeout(() => {
    goToSleep(true);
    sleeping = false;
  }, 2500);
}

export function goToSleep(forced = false) {
  const s = getState();
  if (s.phase !== 'desktop') return;
  if (timer) clearTimeout(timer);
  timer = null;
  queue = [];
  currentConv = null;
  lastChoice = null;
  // Day-bound conversations not seen today are dropped
  const skipped = CONVERSATIONS.filter((c) => c.day === s.day && !s.seenConversations.includes(c.id)).map((c) => c.id);
  playSound(forced ? 'logoff' : 'shutdown');
  setState({
    phase: 'sleep',
    windows: [],
    startOpen: false,
    pendingChoice: null,
    activeConversation: null,
    renTyping: false,
    mayuTyping: false,
    seenConversations: [...s.seenConversations, ...skipped],
    sleepCount: s.sleepCount + 1,
    ren: forced ? s.ren + 1 : s.ren,
    flags: { ...s.flags, forced_sleep: forced },
  });
  setTimeout(() => {
    const st = getState();
    const nextDay = st.day + 1;
    if (nextDay > CONFIG.totalDays) {
      setState({ phase: 'ending', ending: st.ren > st.mayu ? 'stay_online' : 'log_off' });
      return;
    }
    setState({
      day: nextDay,
      clock: CONFIG.dayStartMinutes,
      phase: 'desktop',
      renOnline: false,
      mayuOnline: true,
      wallpaper: st.wallpaper,
    });
    playSound('logon');
  }, 4500);
}

// expose for debugging in console
declare global {
  interface Window {
    nana: { state: typeof getState; set: typeof setState; sleep: typeof goToSleep };
  }
}
window.nana = { state: getState, set: setState, sleep: goToSleep };
