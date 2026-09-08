import { CONFIG } from '../config';
import { getState, isNight, setState, toast, type ChatMessage, type Contact } from '../state/store';
import { playSound } from '../os/sounds';
import { CONVERSATIONS } from './content';
import type { Conversation, Step } from './types';

let queue: Step[] = [];
let currentConv: Conversation | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let tickHandle: ReturnType<typeof setInterval> | null = null;

const CONTACT_NAME: Record<Contact, string> = { ren: 'REN_17', mayu: 'mayu☆' };

export function chatWindowOpenFor(contact: Contact) {
  const s = getState();
  return s.windows.some((w) => {
    if (w.minimized) return false;
    if (w.app === 'messenger') return w.props?.contact === contact;
    if (w.app === 'browser') return w.props?.page === 'messages' && w.props?.contact === contact;
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
      toast(m.channel === 'messenger' ? 'M Messenger' : 'meromero.net', `${CONTACT_NAME[m.from]}: ${m.text}`, '/assets/mm/notif-chat.png');
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

function runNext() {
  const s = getState();
  if (s.phase !== 'desktop') {
    schedule(500, runNext);
    return;
  }
  const step = queue.shift();
  if (!step) {
    if (currentConv) {
      setState((st) => ({ seenConversations: [...st.seenConversations, currentConv!.id], activeConversation: null, renTyping: false }));
      currentConv = null;
    }
    return;
  }
  const conv = currentConv!;
  switch (step.type) {
    case 'msg': {
      if (step.from === 'ren' || step.from === 'mayu') {
        if (step.from === 'ren') setState({ renTyping: true });
        schedule(step.delay ?? typingDelay(step.text), () => {
          setState({ renTyping: false });
          pushMessage({ from: step.from, text: step.text, photo: step.photo, channel: conv.channel });
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
        toast(conv.channel === 'messenger' ? 'M Messenger' : 'meromero.net', `${CONTACT_NAME[conv.contact]} ждёт ответа…`, '/assets/mm/notif-chat.png');
      }
      // wait for chooseOption()
      break;
    }
    case 'set': {
      setState((st) => ({
        ren: st.ren + (step.ren ?? 0),
        mayu: st.mayu + (step.mayu ?? 0),
        flags: { ...st.flags, ...Object.fromEntries((step.flags ?? []).map((f) => [f, true])) },
      }));
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
    case 'unlock':
      if (step.what === 'messenger') {
        setState({ messengerInstalled: true });
        toast('Установка завершена', 'M Messenger добавлен на рабочий стол', '/assets/icons/meromero.png');
        playSound('notify');
      }
      schedule(1500, runNext);
      break;
    case 'comment': {
      setState((st) => {
        const posts = [...st.posts];
        const idx = posts.map((p) => p.author).lastIndexOf('nana');
        if (idx >= 0) posts[idx] = { ...posts[idx], comments: [...posts[idx].comments, { author: step.author, text: step.text }] };
        return { posts };
      });
      playSound('notify');
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

export function setContactStatus(contact: Contact, online: boolean) {
  const s = getState();
  if (contact === 'ren') {
    if (s.renOnline !== online) {
      setState({ renOnline: online, renTyping: false });
      if (s.messengerInstalled || s.flags.ren_commented) {
        playSound(online ? 'online' : 'offline');
        if (online) toast(s.messengerInstalled ? 'M Messenger' : 'meromero.net', 'REN_17 — online', '/assets/mm/dot-green.png');
      }
    }
  } else if (s.mayuOnline !== online) {
    setState({ mayuOnline: online });
  }
}

export function addPost(author: string, text: string, photo?: string) {
  const s = getState();
  setState({
    posts: [
      ...s.posts,
      { id: `${author}_${s.day}_${s.posts.length}`, author, text, day: s.day, time: s.clock, likes: author === 'nana' ? 0 : 3 + ((s.posts.length * 7) % 9), photo, comments: [] },
    ],
  });
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
  setState((st) => ({
    pendingChoice: null,
    ren: st.ren + (opt.ren ?? 0),
    mayu: st.mayu + (opt.mayu ?? 0),
    flags: { ...st.flags, ...Object.fromEntries((opt.flags ?? []).map((f) => [f, true])) },
  }));
  pushMessage({ from: 'nana', text: opt.text.replace(/^\[[^\]]*\]\s*/, '') || opt.text, channel: currentConv.channel });
  if (opt.then) queue.unshift(...opt.then);
  lastChoice = null;
  schedule(500, runNext);
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
      (c) => c.day === s.day && c.at <= clock && !s.seenConversations.includes(c.id) && (!c.when || c.when(s)),
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
  // Any conversations not seen today are dropped
  const skipped = CONVERSATIONS.filter((c) => c.day === s.day && !s.seenConversations.includes(c.id)).map((c) => c.id);
  playSound(forced ? 'logoff' : 'shutdown');
  setState({
    phase: 'sleep',
    windows: [],
    startOpen: false,
    pendingChoice: null,
    activeConversation: null,
    renTyping: false,
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
