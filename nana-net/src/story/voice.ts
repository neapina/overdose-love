import { isNight, stage, type AppId, type GameState } from '../state/store';

/** what Nana thinks the first time (per stage) she opens an app */
export function appOpenedThought(app: AppId, s: GameState): string | null {
  const st = stage(s);
  switch (app) {
    case 'meromero':
      if (!s.flags.mm_registered) return 'meromero. маю говорит, там все. «все» — это она и ещё два человека. ладно.';
      if (st >= 2) return s.renOnline ? 'он в сети.' : 'его нет. ещё нет. обновить.';
      return st === 1 ? 'сначала лента. потом сообщения. потом ещё раз лента.' : 'лента. маю. чужие кошки. норм.';
    case 'homework':
      return st >= 2 ? 'уроки. слово из другой жизни.' : 'уроки. чем быстрее сделаю, тем быстрее вечер.';
    case 'music':
      return st >= 2 && s.flags.ren_song ? 'track07. опять. громче.' : 'тот же плейлист, что и летом. хорошо, что песни не меняются.';
    case 'photos':
      return st >= 2 ? 'фотки с маю. она там смеётся. я там — как будто не я.' : 'фотки. маю везде. это нормально, она везде и в жизни.';
    case 'notepad':
      return st >= 2 ? 'записывать, чтобы не думать. не помогает.' : 'список. молоко. шампунь. жизнь.';
    case 'paint':
      return 'paint. рисовать не умею. но кисточка успокаивает.';
    case 'personalize':
      return st >= 2 ? 'обои темнее. так лучше глазам. и вообще так лучше.' : 'обои. пусть будет вечер. люблю вечер.';
    case 'explorer':
      return st >= 3 ? 'папки, которых я не создавала. или создавала. не помню.' : null;
    default:
      return null;
  }
}

/** something Nana mutters when the player does nothing for a while */
export function idleThought(s: GameState): string {
  const st = stage(s);
  const night = isNight(s);
  const pool = !s.flags.mm_registered
    ? ['маю: «зарегайся на meromero». ладно, ладно.', 'значок meromero смотрит на меня. я — на него.', 'ник придумать. аватарку выбрать. пять минут. а я сижу.', 'без страницы мне никто не напишет. это плюс. или минус.']
    : st >= 3
      ? ['курсор мигает. я тоже.', 'обновить. обновить. обновить.', 'сколько сейчас? неважно.', 'в комнате холодно. не вставать.']
      : st === 2
        ? night
          ? ['зелёный кружок не загорается.', 'он писал, что не спит. значит скоро.', 'тихо. ноутбук гудит. хорошо.']
          : ['ещё рано. он появляется позже.', 'маю что-то писала. потом.', 'домашка лежит. пусть лежит.']
        : night
          ? ['уже поздно. ещё чуть-чуть и спать.', 'маю точно спит. я — почти.', 'ночью монитор как окно.']
          : ['скучно. хорошо-скучно.', 'что-нибудь запостить? нет. потом.', 'маю скинула бы что-нибудь. ждём.', 'уроки сами себя не сделают. к сожалению.'];
  return pool[(s.day * 7 + Math.floor(s.clock / 13)) % pool.length];
}
