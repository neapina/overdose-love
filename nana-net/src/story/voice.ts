import { isNight, stage, type AppId, type GameState } from '../state/store';

/** what Nana thinks the first time (per stage) she opens an app */
export function appOpenedThought(app: AppId, s: GameState): string | null {
  const st = stage(s);
  switch (app) {
    case 'meromero':
      if (!s.flags.mm_registered) return 'ну ок. маю говорит, там вообще все сидят. посмотрим, кто это «все»';
      if (st >= 2) return s.renOnline ? 'онлайн' : 'нет его. ладно. обновлю попозже';
      return st === 1 ? 'лента, потом сообщения, потом опять лента. как обычно' : 'о, маю запостила что-то. и чей-то кот';
    case 'homework':
      return st >= 2 ? 'уроки. господи. ладно, быстро' : 'сначала уроки, а то потом опять до двух буду сидеть';
    case 'music':
      return st >= 2 && s.flags.ren_song ? 'track07. ещё раз' : 'тот же плейлист с лета. ну и пусть';
    case 'photos':
      return st >= 2 ? 'фотки с маю. она ржёт на всех, а я какая-то… не знаю' : 'фотки. маю на каждой второй, конечно';
    case 'notepad':
      return st >= 2 ? 'пишу, чтоб не думать. помогает слабо' : 'список покупок. молоко. шампунь. захватывающе';
    case 'paint':
      return 'рисовать не умею, но кисточкой водить норм';
    case 'personalize':
      return st >= 2 ? 'потемнее. глазам легче' : 'обои. вечерние оставлю, они красивые';
    case 'explorer':
      return st >= 3 ? 'эту папку я не создавала. или создавала? не помню уже' : null;
    default:
      return null;
  }
}

/** something Nana mutters when the player does nothing for a while */
export function idleThought(s: GameState): string {
  const st = stage(s);
  const night = isNight(s);
  const pool = !s.flags.mm_registered
    ? ['маю опять: «зарегайся». да зарегаюсь я', 'ник надо придумать. аватарку. ужас, пять минут дела', 'сижу и смотрю на значок. значок смотрит на меня', 'ну а вдруг там правда все']
    : st >= 3
      ? ['курсор мигает', 'обновить. обновить. ещё раз', 'сколько времени? да какая разница', 'холодно. вставать за пледом лень']
      : st === 2
        ? night
          ? ['кружок не зелёный', 'он писал, что не спит по ночам. значит скоро', 'тихо. только комп гудит. нормально']
          : ['рано ещё. он позже появляется', 'маю что-то писала. потом отвечу', 'уроки лежат. ну лежат']
        : night
          ? ['поздно уже. ещё чуть и спать', 'маю сто процентов спит', 'ночью монитор как окно, только теплее']
          : ['скучно. но так, нормально скучно', 'запостить что-нибудь? да не, нечего', 'маю бы что-нибудь скинула уже', 'уроки, да. сейчас'];
  return pool[(s.day * 7 + Math.floor(s.clock / 13)) % pool.length];
}
