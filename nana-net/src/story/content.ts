import type { Conversation, Ending, Step } from './types';
import { hasStatus } from './social';

const t = (h: number, m = 0) => h * 60 + m;
const r = (text: string, extra: Partial<Extract<Step, { type: 'msg' }>> = {}): Step => ({ type: 'msg', from: 'ren', text, ...extra });
const my = (text: string, extra: Partial<Extract<Step, { type: 'msg' }>> = {}): Step => ({ type: 'msg', from: 'mayu', text, ...extra });
const n = (text: string): Step => ({ type: 'msg', from: 'nana', text });
const sys = (text: string): Step => ({ type: 'msg', from: 'system', text });
const on = (c: 'ren' | 'mayu'): Step => ({ type: 'status', contact: c, online: true });
const off = (c: 'ren' | 'mayu'): Step => ({ type: 'status', contact: c, online: false });
const pause = (ms: number): Step => ({ type: 'pause', ms });
const think = (text: string): Step => ({ type: 'think', text });

export const CONVERSATIONS: Conversation[] = [
  // ───────────────────────── DAY 1 · только Маю ─────────────────────────
  {
    id: 'd1_mayu_hello',
    contact: 'mayu',
    at: t(19, 46),
    when: (s) => !!s.flags.mm_registered && !s.flags.mayu_friend,
    steps: [
      on('mayu'),
      think('зелёный кружок. маю. ну конечно.'),
      my('НАНА'),
      my('НАНА ТЫ ЗАРЕГАЛАСЬ НАКОНЕЦ'),
      my('я тебя нашла по нику ✌🏻'),
      my('у меня на странице 0 друзей это стыдно, добавь меня'),
      { type: 'toast', title: 'meromero', text: 'mayu☆ хочет добавить тебя в друзья' },
      {
        type: 'choice',
        options: [
          { text: 'добавила!! у тебя страница как торт', mayu: 2, then: [my('ЭТО КОМПЛИМЕНТ??'), my('ладно принимаю')] },
          { text: 'сейчас, я ещё оформляю', mayu: 1, then: [my('ок ок'), my('только не делай всё серое как обычно'), my('поставь розовое!!!')] },
        ],
      },
      { type: 'set', flags: ['mayu_friend'] },
      { type: 'toast', title: 'meromero', text: 'mayu☆ теперь у тебя в друзьях', icon: '/assets/mm/heart-small.png' },
      my('поставь статус и песню в профиле. и запости что-нибудь. ну хоть «привет»'),
      my('я пошла есть. потом проверю ✌🏻'),
      think('«запости что-нибудь». что. про что вообще пишут.'),
    ],
  },
  {
    id: 'd1_mayu_checks_post',
    contact: 'mayu',
    day: 1,
    at: t(20, 20),
    when: (s) => !!s.flags.posted,
    steps: [
      { type: 'like', author: 'mayu☆' },
      { type: 'comment', author: 'mayu☆', text: 'первая запись!!! ✌🏻' },
      my('видела. лайк. ✌🏻'),
      think('один лайк. от маю. это считается.'),
    ],
  },
  {
    id: 'd1_mayu_no_post',
    contact: 'mayu',
    day: 1,
    at: t(21, 30),
    when: (s) => !s.flags.posted,
    steps: [my('у тебя всё ещё 0 записей'), my('я не дружу с ботами. напиши что-нибудь')],
  },
  {
    id: 'd1_mayu_cafe',
    contact: 'mayu',
    day: 1,
    at: t(22, 5),
    steps: [
      my('слушай'),
      my('завтра после школы. кафе у станции. новое. там блинчики с кремом размером с мою голову'),
      my('идёшь?'),
      {
        type: 'choice',
        options: [
          { text: 'иду. только не ори на всю станцию', mayu: 3, flags: ['d1_cafe_yes'], then: [my('Я НЕ ОРУ'), my('ладно ору'), my('в 16:10 у выхода Б, не опаздывай ✌🏻')] },
          { text: 'посмотрю по настроению', mayu: -1, flags: ['d1_cafe_maybe'], then: [my('«по настроению»'), my('нана у тебя одно настроение и оно «дома»'), my('ладно. напишу завтра')] },
        ],
      },
      my('всё, спать. и ты ложись'),
      off('mayu'),
    ],
  },
  {
    id: 'd1_mayu_hw',
    contact: 'mayu',
    day: 1,
    at: t(21, 0),
    when: (s) => s.mayuOnline,
    steps: [
      my('слушай а ты англ сделала? unit 7'),
      {
        type: 'choice',
        options: [
          { text: 'сделала. ещё днём', mayu: 1, flags: ['hw_brag'], then: [my('зубрилка'), my('скинь ответы ✌🏻'), my('шучу. не шучу')] },
          { text: 'нет ещё. сейчас сяду', mayu: 0, then: [my('ага. «сейчас»'), my('я тоже «сейчас». уже третий час')] },
          { text: 'какой юнит', mayu: 0, flags: ['hw_forgot'], then: [my('НАНА'), my('седьмой. тест завтра. ты вообще была на уроке')] },
        ],
      },
    ],
  },
  // тихий первый след: чей-то лайк поздно ночью
  {
    id: 'd1_stranger_like',
    contact: 'ren',
    day: 1,
    at: t(23, 50),
    when: (s) => !!s.flags.posted,
    steps: [{ type: 'like', author: 'REN_17' }, { type: 'set', flags: ['ren_liked'] }, think('кто-то с ником через нижнее подчёркивание. поздно не спит. ну ок.')],
  },

  // ───────────────────────── DAY 2 · кафе, первый комментарий ─────────────────────────
  {
    id: 'd2_mayu_cafe_yes',
    contact: 'mayu',
    day: 2,
    at: t(19, 46),
    when: (s) => !!s.flags.d1_cafe_yes,
    steps: [
      on('mayu'),
      my('ЭТО БЫЛО ЛУЧШЕЕ КАФЕ В МОЕЙ ЖИЗНИ'),
      my('я выложила фотку где ты с кремом на носу. не удаляй'),
      { type: 'post', author: 'mayu', text: 'блинчики > всё. нана не согласна но она не права 🥞✌🏻', photo: 'cafe_mayu' },
      { type: 'set', flags: ['photo_cafe'] },
      my('в субботу повторим?'),
      my('и напиши что-то про кафе. для истории ✌🏻'),
    ],
  },
  {
    id: 'd2_mayu_cafe_no',
    contact: 'mayu',
    day: 2,
    at: t(19, 46),
    when: (s) => !s.flags.d1_cafe_yes,
    steps: [
      on('mayu'),
      my('ну ты и не пришла'),
      my('я тебе три раза писала'),
      my('ладно. блинчики были огромные. ты много потеряла'),
      { type: 'post', author: 'mayu', text: 'одна в кафе. блинчик всё равно съела. ✌🏻', photo: 'cafe_alone' },
      my('в субботу точно идём. без «по настроению»'),
    ],
  },
  {
    id: 'd2_ren_comment',
    contact: 'ren',
    day: 2,
    at: t(21, 10),
    when: (s) => !!s.flags.posted,
    steps: [
      pause(3000),
      { type: 'comment', author: 'REN_17', text: 'я тоже постоянно не сплю ночью' },
      { type: 'set', flags: ['ren_commented'] },
      think('опять он. ren_17. комментирует, как будто мы знакомы.'),
    ],
  },
  {
    id: 'd2_mayu_late',
    contact: 'mayu',
    day: 2,
    at: t(23, 20),
    when: (s) => s.mayuOnline,
    steps: [my('ты чего не спишь? я вижу зелёный кружок'), my('ложись. завтра история'), off('mayu')],
  },
  {
    id: 'd2_mayu_hw_check',
    contact: 'mayu',
    day: 2,
    at: t(20, 40),
    when: (s) => s.mayuOnline && !!s.flags.hw_forgot,
    steps: [my('кстати. ты вчера тест по англ так и не сделала, да?'), my('я видела твоё лицо на уроке ✌🏻'), { type: 'set', mayu: -1 }],
  },

  // ───────────────────────── DAY 3 · первое сообщение ─────────────────────────
  {
    id: 'd3_ren_comment_again',
    contact: 'ren',
    day: 3,
    at: t(19, 50),
    when: (s) => !!s.flags.posted && !s.flags.ren_known,
    steps: [{ type: 'comment', author: 'REN_17', text: 'извини если лезу. просто у тебя хорошая страница. тихая' }, { type: 'set', flags: ['ren_commented'] }],
  },
  {
    id: 'd3_mayu_walk',
    contact: 'mayu',
    day: 3,
    at: t(20, 15),
    steps: [
      on('mayu'),
      my('НАНА'),
      my('у реки фонари включили, там красиво. пошли сегодня гулять!!!'),
      my('через полчаса у твоего подъезда?'),
      {
        type: 'choice',
        options: [
          {
            text: 'иду. только куртку найду',
            mayu: 3,
            flags: ['d3_went_mayu'],
            then: [
              my('✌🏻✌🏻✌🏻'),
              off('mayu'),
              pause(6000),
              on('mayu'),
              { type: 'post', author: 'mayu', text: 'фонари у реки + нана + мой новый фотик = ✌🏻', photo: 'river_nana' },
              { type: 'set', flags: ['photo_river'] },
              my('ЭТО БЫЛО ИДЕАЛЬНО'),
              my('ты почти улыбнулась на фотке. почти'),
            ],
          },
          {
            text: 'не сегодня. голова болит',
            mayu: -2,
            flags: ['d3_stayed'],
            then: [my('опять?'), my('ладно. одна пойду'), my('сфоткаю фонари для тебя'), off('mayu')],
          },
        ],
      },
    ],
  },
  {
    id: 'd3_ren_first_dm',
    contact: 'ren',
    day: 3,
    at: t(22, 30),
    when: (s) => !!s.flags.ren_known,
    steps: [
      on('ren'),
      pause(5000),
      think('он в сети. тот, который комментирует. ладно, и что.'),
      r('привет. это ren_17, я под твоими записями комментировал'),
      r('надеюсь не странно, что пишу в личку'),
      r('просто у тебя в профиле песня стоит. я её слушал всё лето. думал, никто её не знает'),
      {
        type: 'choice',
        options: [
          { text: 'не странно. я тоже думала, что её никто не знает', ren: 2, then: [r('ха'), r('значит нас двое')] },
          { text: 'привет. немного странно, но ладно', ren: 1, then: [r('честно. ценю')] },
          { text: 'кто ты вообще?', ren: 0, flags: ['asked_who'], then: [r('никто особенный'), r('17, не сплю, слушаю то же что и ты'), r('этого пока хватит?')] },
        ],
      },
      r('ладно. не буду мешать'),
      r('спокойной ночи'),
      pause(1500),
      off('ren'),
      think('«значит нас двое». я перечитала это три раза. зачем.'),
    ],
  },

  // ───────────────────────── DAY 4 · разговор ─────────────────────────
  {
    id: 'd4_mayu_bakery',
    contact: 'mayu',
    day: 4,
    at: t(19, 44),
    steps: [
      on('mayu'),
      my('нана ты сегодня выйдешь?'),
      my('я в магазине рядом с тобой, тут продают те булочки с маття'),
      {
        type: 'choice',
        options: [
          { text: 'выйду на 10 минут', mayu: 2, flags: ['d4_went_out'], then: [my('✌🏻✌🏻✌🏻'), pause(2500), my('ты какая-то бледная. ты спишь вообще?'), my('ладно. булочка тебе. ешь')] },
          { text: 'не сегодня, голова болит', mayu: -2, then: [my('опять?'), my('ок'), my('оставлю булочку в почтовом ящике. серьёзно')] },
        ],
      },
      off('mayu'),
    ],
  },
  {
    id: 'd4_ren_talk',
    contact: 'ren',
    day: 4,
    at: t(22, 40),
    when: (s) => !!s.flags.ren_known,
    steps: [
      on('ren'),
      pause(3000),
      r('привет. ты тут'),
      r('можно вопрос. ты часто не спишь?'),
      {
        type: 'choice',
        options: [
          { text: 'почти каждую ночь. днём всё какое-то громкое', ren: 2, flags: ['told_ren_night'], then: [r('да'), r('ночью как будто интернет только твой'), r('я тоже так думаю')] },
          { text: 'иногда. когда не могу выключить голову', ren: 1, then: [r('понимаю'), r('у меня то же самое')] },
          { text: 'нет. просто сегодня', ren: -1, then: [r('ясно'), r('а я всегда')] },
        ],
      },
      r('у меня дома опять шумно. отец. не важно'),
      r('просто хотел с кем-то нормальным поговорить'),
      {
        type: 'choice',
        options: [
          { text: 'я тут. рассказывай', ren: 2, flags: ['listened_ren'], then: [r('спасибо'), r('с тобой тихо. в хорошем смысле'), r('я тебе кое-что покажу. только не смейся'), r('это я', { photo: 'ren_1' }), { type: 'set', flags: ['ren_photo1'] }] },
          { text: 'может тебе с кем-то из своих поговорить?', ren: -1, mayu: 1, then: [r('у меня нет «своих»'), r('ладно'), r('покажу кое-что. чтоб ты знала с кем говоришь'), r('это я', { photo: 'ren_1' }), { type: 'set', flags: ['ren_photo1'] }] },
        ],
      },
      {
        type: 'choice',
        options: [
          { text: 'не смеюсь. у тебя доброе лицо', ren: 2, then: [r('…'), r('никто мне так не говорил')] },
          { text: 'фото какое-то тёмное. где это?', ren: 0, flags: ['noticed_photo1'], then: [r('это дома. лампа плохая')] },
        ],
      },
      r('спокойной ночи, нана'),
      off('ren'),
    ],
  },

  // ───────────────────────── DAY 5 · ожидание ─────────────────────────
  {
    id: 'd5_mayu',
    contact: 'mayu',
    day: 5,
    at: t(20, 5),
    when: (s) => s.mayu >= 6,
    steps: [
      on('mayu'),
      my('нанааа'),
      my('в субботу поедем к морю? электричка в 9. я всё продумала'),
      {
        type: 'choice',
        options: [
          { text: 'поедем. я возьму термос', mayu: 3, flags: ['sea_plan'], then: [my('ТЕРМОС!!!'), my('ты идеальная'), my('ложись пораньше, ок?')] },
          { text: 'посмотрим ближе к выходным', mayu: -1, then: [my('…'), my('нана «посмотрим» это «нет» на твоём языке'), my('ладно')] },
        ],
      },
      off('mayu'),
    ],
  },
  {
    id: 'd5_mayu_low',
    contact: 'mayu',
    day: 5,
    at: t(20, 5),
    when: (s) => s.mayu < 6,
    steps: [
      on('mayu'),
      my('опять нет?'),
      my('ты в школе весь день в телефоне. я рядом сидела. ты не заметила'),
      {
        type: 'choice',
        options: [
          { text: 'прости. я заметила. просто устала', mayu: 2, then: [my('ок'), my('я тут, если что. правда')] },
          { text: 'я просто общаюсь с одним человеком', mayu: -2, flags: ['told_mayu_ren'], then: [my('с ren_17?'), my('я видела его комментарии'), my('нана, ты его хотя бы видела вживую?'), my('…ладно. не моё дело')] },
        ],
      },
      off('mayu'),
    ],
  },
  {
    id: 'd5_ren_silent',
    contact: 'ren',
    day: 5,
    at: t(21, 0),
    when: (s) => !!s.flags.ren_known,
    steps: [sys('REN_17 не в сети')],
  },
  {
    id: 'd5_ren_late',
    contact: 'ren',
    day: 5,
    at: t(25, 15),
    when: (s) => !!s.flags.ren_known,
    steps: [
      on('ren'),
      r('прости'),
      r('дома было плохо, я не мог сесть за компьютер'),
      r('ты ждала?'),
      {
        type: 'choice',
        options: [
          { text: 'ждала. проверяла каждые пять минут', ren: 3, flags: ['admitted_waiting'], then: [r('…'), r('это самое тёплое, что мне говорили за год'), r('я не хочу, чтобы ты ждала. но я рад')] },
          { text: 'немного. занималась своими делами', ren: 1, then: [r('хорошо'), r('это правильно')] },
          { text: 'нет', ren: -1, mayu: 1, then: [r('ок'), r('хорошо что нет')] },
        ],
      },
      r('можно попросить? отправь мне свою фотографию. любую'),
      r('я просто хочу знать, с кем говорю'),
      think('у меня одно фото, где видно лицо. с вебки. прошлогоднее. оно в папке photos.'),
      {
        type: 'choice',
        options: [
          { text: 'вот. старое. не смейся', photo: 'nana_old', ren: 3, flags: ['asked_photo', 'sent_photo'], then: [r('…'), r('ты красивая'), r('я так и думал'), r('спасибо')] },
          { text: 'не сейчас. я ужасно выгляжу в 1:20 ночи', ren: -1, mayu: 1, flags: ['kept_photo'], then: [r('ты не можешь ужасно выглядеть'), r('ладно. когда захочешь')] },
        ],
      },
      r('я скинул тебе одну песню. она в загрузках. без названия'),
      { type: 'set', flags: ['ren_song'] },
      { type: 'toast', title: 'Загрузки', text: 'track07.mp3 — загрузка завершена', icon: '/assets/icons/media-player.png' },
      r('послушай когда меня не будет'),
      off('ren'),
      think('track07. без названия. в загрузках. потом. сейчас.'),
    ],
  },

  // ───────────────────────── DAY 6 · крыша ─────────────────────────
  {
    id: 'd6_mayu_silence',
    contact: 'mayu',
    day: 6,
    at: t(19, 50),
    when: (s) => s.mayu < 8,
    steps: [my('окей'), off('mayu')],
  },
  {
    id: 'd6_mayu_ok',
    contact: 'mayu',
    day: 6,
    at: t(19, 50),
    when: (s) => s.mayu >= 8,
    steps: [on('mayu'), my('я распечатала ту фотку с реки. повесила над столом'), my('ты там как будто из другого времени'), my('завтра в 9 у станции. термос!!!'), off('mayu')],
  },
  {
    id: 'd6_ren_photo2',
    contact: 'ren',
    day: 6,
    at: t(22, 10),
    when: (s) => !!s.flags.ren_known,
    steps: [
      on('ren'),
      r('привет. сегодня рано'),
      r('я ходил на крышу. вот', { photo: 'ren_2' }),
      { type: 'set', flags: ['ren_photo2'] },
      r('солнце было как в твоём посте про дождь'),
      {
        type: 'choice',
        options: [
          {
            text: 'красиво… но у тебя тут другая причёска, чем на первом фото',
            ren: -1,
            flags: ['doubt'],
            then: [
              r('…'),
              r('это старое. я его сделал год назад, просто оно мне нравится'),
              r('извини что не сказал'),
              r('ты злишься?'),
              {
                type: 'choice',
                options: [
                  { text: 'нет. просто говори, когда фото старое', ren: 1, then: [r('хорошо'), r('обещаю')] },
                  { text: 'не знаю. всё немного странно', ren: -1, flags: ['doubt_strong'], then: [r('понимаю'), r('я не хочу тебя терять из-за фотографии'), r('прости')] },
                ],
              },
            ],
          },
          { text: 'красиво. хочу так же на крышу', ren: 2, then: [r('когда-нибудь вместе'), r('я серьёзно')] },
        ],
      },
      r('нана'),
      r('можно я буду говорить тебе «спокойной ночи» каждый день?'),
      {
        type: 'choice',
        options: [
          { text: 'можно', ren: 3, flags: ['goodnight_ritual'], then: [r('спокойной ночи, нана')] },
          { text: 'только если я не буду этого ждать', ren: 1, mayu: 1, then: [r('ты умнее меня'), r('спокойной ночи')] },
        ],
      },
      off('ren'),
      { type: 'wallpaper', value: 'dusk' },
    ],
  },
  {
    id: 'd6_ren_conflict',
    contact: 'ren',
    day: 6,
    at: t(25, 20),
    when: (s) => !!s.flags.doubt_strong,
    steps: [
      on('ren'),
      r('ты не спишь. я знаю'),
      r('ты сказала «всё странно». я думал об этом три часа'),
      {
        type: 'choice',
        options: [
          {
            text: 'скажи честно. это ты на фотографиях?',
            flags: ['confronted'],
            then: [
              pause(6000),
              r('…'),
              r('это я. но не совсем'),
              r('я немного менял. свет. лицо. чуть-чуть'),
              r('в интернете ты можешь быть тем, кем хочешь. я хотел быть тем, с кем ты захочешь говорить'),
              r('прости'),
              {
                type: 'choice',
                options: [
                  { text: 'я говорила не с фотографией. я говорила с тобой', ren: 2, mayu: 1, flags: ['forgave'], then: [r('…'), r('спасибо'), r('спокойной ночи, нана. настоящей')] },
                  { text: 'мне нужно время', ren: -2, flags: ['need_time'], then: [r('понимаю'), r('я буду тут'), r('или нет. как получится')] },
                ],
              },
            ],
          },
          { text: 'неважно. я просто устала', ren: 2, then: [r('хорошо'), r('я боялся'), r('спокойной ночи, нана')] },
        ],
      },
      off('ren'),
    ],
  },
  {
    id: 'd6_ren_meet',
    contact: 'ren',
    day: 6,
    at: t(25, 20),
    when: (s) => !!s.flags.ren_known && !s.flags.doubt_strong,
    steps: [
      on('ren'),
      r('ты не спишь. я знаю'),
      r('давай встретимся. по-настоящему. в воскресенье. у фонтана возле станции. в два'),
      r('я приеду. час на электричке, это ничего'),
      {
        type: 'choice',
        options: [
          { text: 'да. давай', ren: 3, flags: ['meet_agreed'], then: [r('правда?'), r('я буду в серой куртке'), r('не могу поверить'), r('спокойной ночи. до воскресенья')] },
          { text: 'я пока не готова', ren: -1, mayu: 1, flags: ['meet_declined'], then: [r('хорошо'), r('я не давлю'), r('просто знай, что я хотел бы'), r('спокойной ночи')] },
        ],
      },
      off('ren'),
      { type: 'wallpaper', value: 'night' },
    ],
  },
  {
    id: 'd6_ren_gone',
    contact: 'ren',
    day: 6,
    at: t(27, 0),
    when: (s) => !!s.flags.need_time,
    steps: [
      sys('Контакт REN_17 больше не существует'),
      { type: 'set', flags: ['ren_gone'] },
      { type: 'toast', title: 'meromero', text: 'Пользователь не найден', icon: '/assets/mm/dot-grey.png' },
      think('«пользователь не найден». я обновила страницу. ещё раз. ещё.'),
      { type: 'wallpaper', value: 'night' },
    ],
  },

  // ───────────────────────── DAY 7 · финалы ─────────────────────────
  {
    id: 'd7_gone_ending',
    contact: 'mayu',
    day: 7,
    at: t(19, 45),
    when: (s) => !!s.flags.ren_gone,
    steps: [
      sys('REN_17 — пользователь не найден'),
      pause(3000),
      on('mayu'),
      my('нана. ты дома?'),
      my('я тут внизу. с булочками'),
      {
        type: 'choice',
        options: [
          { text: 'спускаюсь', mayu: 3, then: [my('✌🏻'), pause(2000), { type: 'end', ending: 'user_not_found' }] },
          { text: 'не сегодня', then: [my('ок'), pause(2000), { type: 'end', ending: 'user_not_found' }] },
        ],
      },
    ],
  },
  {
    id: 'd7_meet_ending',
    contact: 'ren',
    day: 7,
    at: t(19, 45),
    when: (s) => !!s.flags.meet_agreed && !s.flags.ren_gone,
    steps: [
      sys('Воскресенье. 13:52. Фонтан у станции.'),
      pause(2500),
      on('ren'),
      r('я здесь. слева от фонтана'),
      r('серая куртка'),
      pause(3000),
      sys('Ты его видишь.'),
      sys('Он ниже. Другие волосы. Очки. Он нервно смотрит в телефон. Он выглядит как человек, который два часа выбирал куртку.'),
      sys('Он совсем не похож на того, кого ты придумала.'),
      sys('Он смотрит на тебя. Он тоже это понимает.'),
      {
        type: 'choice',
        options: [
          { text: 'подойти', flags: ['meet_walked'], then: [pause(2000), { type: 'end', ending: 'meet_me' }] },
          { text: 'развернуться', flags: ['meet_left'], then: [pause(2000), { type: 'end', ending: 'meet_me_left' }] },
        ],
      },
    ],
  },
  {
    id: 'd7_no_ren_ending',
    contact: 'mayu',
    day: 7,
    at: t(19, 45),
    when: (s) => !s.flags.ren_known,
    steps: [
      on('mayu'),
      my('нана. я у станции. термос у меня'),
      my('электричка через 20 минут. ты идёшь?'),
      {
        type: 'choice',
        options: [
          { text: 'бегу', mayu: 3, then: [my('✌🏻✌🏻✌🏻'), pause(2000), { type: 'end', ending: 'mayu' }] },
          { text: 'не сегодня', mayu: -3, then: [my('…'), my('ладно'), pause(2000), { type: 'end', ending: 'log_off' }] },
        ],
      },
    ],
  },
  {
    id: 'd7_final',
    contact: 'ren',
    day: 7,
    at: t(19, 45),
    when: (s) => !!s.flags.ren_known && !s.flags.meet_agreed && !s.flags.ren_gone,
    steps: [
      on('ren'),
      r('привет'),
      r('ты сегодня будешь?'),
      r('всю ночь?'),
      pause(2500),
      on('mayu'),
      my('нана. я у станции. термос у меня. ты идёшь?'),
      my('я подожду 10 минут'),
      {
        type: 'choice',
        options: [
          {
            text: '[Закрыть meromero и выйти к Маю]',
            mayu: 3,
            flags: ['final_mayu'],
            then: [n('рэн, я пойду. напишу позже. может быть'), r('…'), r('хорошо'), off('ren'), my('ВИЖУ ТЕБЯ'), pause(2000), { type: 'end', ending: 'mayu' }],
          },
          {
            text: '[Остаться. Написать Маю «не сегодня»]',
            ren: 3,
            flags: ['final_ren'],
            then: [my('окей'), off('mayu'), r('она обидится?'), n('нет. она привыкла'), r('спасибо, что осталась'), r('я тут. всегда'), pause(2500), { type: 'end', ending: 'stay_online' }],
          },
          {
            text: '[Написать обоим честно]',
            ren: 0,
            mayu: 1,
            flags: ['final_balance'],
            then: [
              n('рэн, я сегодня пойду к маю. напишу вечером. я не пропадаю, просто у меня есть жизнь и здесь тоже'),
              r('…'),
              r('ты права'),
              r('иди. напиши потом'),
              n('маю, иду. 5 минут. термос не пей весь'),
              my('✌🏻✌🏻✌🏻'),
              pause(2500),
              { type: 'end', ending: 'balance' },
            ],
          },
        ],
      },
    ],
  },

  // ───────────────────────── реакции на статус (любой день) ─────────────────────────
  {
    id: 'status_die_mayu',
    contact: 'mayu',
    when: (s) => hasStatus(s, 'die') && s.mayuOnline,
    steps: [
      pause(4000),
      my('нана.'),
      my('что за статус'),
      {
        type: 'choice',
        options: [
          { text: 'это строчка из песни', mayu: 0, then: [my('из какой'), my('…ладно. но убери, пожалуйста. мне не смешно')] },
          { text: 'не знаю. просто так написалось', mayu: 2, flags: ['status_die_honest'], then: [my('я сейчас позвоню'), my('нет. не буду. ты не любишь звонки'), my('я тут. серьёзно. в любое время. напиши мне'), my('и убери это. ради меня')] },
          { text: 'не обращай внимания', mayu: -2, flags: ['status_die_dismiss'], then: [my('«не обращай внимания»'), my('нана, я обращаю. это моя работа')] },
        ],
      },
    ],
  },
  {
    id: 'status_die_ren',
    contact: 'ren',
    when: (s) => hasStatus(s, 'die') && !!s.flags.ren_known && s.renOnline,
    steps: [pause(6000), r('видел твой статус'), r('я тоже так иногда'), r('не убирай. пусть висит. это честно'), { type: 'set', ren: 2, flags: ['ren_saw_die'] }],
  },
  {
    id: 'status_mayu_love',
    contact: 'mayu',
    when: (s) => hasStatus(s, 'mayu') && s.mayuOnline,
    steps: [pause(3000), my('НАНА Я ВИДЕЛА СТАТУС'), my('😭✌🏻'), my('я тоже тебя люблю. дура'), { type: 'post', author: 'mayu', text: 'у меня лучшая подруга в мире и это официально (см. её статус) ✌🏻' }, { type: 'set', mayu: 2, flags: ['status_love_seen'] }],
  },
  {
    id: 'status_pancakes',
    contact: 'mayu',
    when: (s) => hasStatus(s, 'pancakes') && s.mayuOnline,
    steps: [pause(3000), my('✌🏻✌🏻✌🏻'), my('ты украла мой статус и я не против'), { type: 'set', mayu: 1 }],
  },
  {
    id: 'status_bored',
    contact: 'mayu',
    when: (s) => hasStatus(s, 'bored') && s.mayuOnline && s.day <= 5,
    steps: [
      pause(3000),
      my('скучно?? пошли гулять'),
      my('я серьёзно. 15 минут и я у тебя'),
      {
        type: 'choice',
        options: [
          { text: 'ладно. 15 минут', mayu: 2, flags: ['bored_walk'], then: [my('✌🏻'), off('mayu'), pause(5000), on('mayu'), my('это было хорошо'), my('ты смеялась. запомни это')] },
          { text: 'не, скучно в хорошем смысле', mayu: 0, then: [my('такого не бывает'), my('ладно')] },
        ],
      },
    ],
  },
  {
    id: 'status_sleepless_mayu',
    contact: 'mayu',
    when: (s) => (hasStatus(s, 'sleepless') || hasStatus(s, 'night')) && s.mayuOnline && !s.flags.ren_known,
    steps: [pause(3000), my('«не спится»??'), my('нана сейчас 10 вечера'), my('ложись раньше и будет спаться')],
  },
  {
    id: 'status_sleepless_ren',
    contact: 'ren',
    when: (s) => (hasStatus(s, 'sleepless') || hasStatus(s, 'night')) && !!s.flags.ren_known && s.renOnline,
    steps: [pause(4000), r('не спится?'), r('мне тоже'), r('хороший статус'), { type: 'set', ren: 1 }],
  },
  {
    id: 'status_waiting',
    contact: 'ren',
    when: (s) => hasStatus(s, 'waiting') && !!s.flags.ren_known && s.renOnline,
    steps: [
      pause(4000),
      r('«жду»'),
      r('кого?'),
      {
        type: 'choice',
        options: [
          { text: 'тебя', ren: 3, flags: ['said_waiting_ren'], then: [r('…'), r('я тут'), r('я больше не опоздаю')] },
          { text: 'никого. просто слово', ren: 0, then: [r('ок'), r('хорошее слово')] },
        ],
      },
    ],
  },
  {
    id: 'status_nobody',
    contact: 'mayu',
    when: (s) => hasStatus(s, 'nobody') && s.mayuOnline,
    steps: [
      pause(3000),
      my('«никого нет»?'),
      my('а я?'),
      {
        type: 'choice',
        options: [
          { text: 'ты есть. прости', mayu: 2, then: [my('то-то же'), my('убери статус. или поставь «есть маю»')] },
          { text: 'ты не понимаешь', mayu: -2, flags: ['pushed_mayu'], then: [my('…'), my('ок'), off('mayu')] },
        ],
      },
    ],
  },

  // ───────────────────────── реакции на песню ─────────────────────────
  {
    id: 'song_first',
    contact: 'mayu',
    when: (s) => !!s.profile.song && s.mayuOnline,
    steps: [pause(3000), my('о, песня появилась'), my('лучше чем тишина. но я бы поставила что-то повеселее ✌🏻'), { type: 'set', flags: ['song_seen_mayu'] }],
  },
  {
    id: 'song_sleepless_mayu',
    contact: 'mayu',
    when: (s) => s.profile.song.startsWith('sleepless') && s.mayuOnline && !!s.flags.song_seen_mayu,
    steps: [pause(3000), my('ты поставила sleepless'), my('ты спишь вообще?'), { type: 'set', mayu: 0 }],
  },
  {
    id: 'song_ren_reacts',
    contact: 'ren',
    when: (s) => !!s.profile.song && !s.profile.song.startsWith('track07') && !!s.flags.ren_known && s.renOnline,
    steps: [pause(4000), r('у тебя в профиле новая песня. я её знаю. это хорошая'), { type: 'set', ren: 1, flags: ['song_seen_ren'] }],
  },
  {
    id: 'song_track07_ren',
    contact: 'ren',
    when: (s) => !!s.flags.listened_ren_song && !!s.flags.ren_known && s.renOnline && !s.flags.ren_gone,
    steps: [
      pause(3000),
      r('послушала?'),
      {
        type: 'choice',
        options: [
          { text: 'да. три раза', ren: 3, flags: ['loved_track07'], then: [r('это я записал'), r('никому не показывал'), r('только тебе')] },
          { text: 'да. странная. но хорошая', ren: 1, then: [r('странная — это хорошо'), r('это я записал. на телефон')] },
          { text: 'не до конца', ren: -1, then: [r('ок'), r('ничего')] },
        ],
      },
    ],
  },
  {
    id: 'song_track07_profile',
    contact: 'mayu',
    when: (s) => s.profile.song.startsWith('track07') && s.mayuOnline,
    steps: [pause(3000), my('что за track07'), my('у него даже названия нет'), my('это от него, да?'), { type: 'set', mayu: -1, flags: ['mayu_knows_track07'] }],
  },
];

export const ENDINGS: Record<string, Ending> = {
  mayu: {
    title: 'MAYU',
    lines: [
      'Нана закрывает meromero.',
      'На улице холодно и пахнет дождём. Маю уже машет с другой стороны дороги.',
      'Финальная фотография этого дня — ужасного качества. Размытая. Пересвеченная. Маю смеётся, Нана почти улыбается.',
      'Именно поэтому она выглядит самой настоящей.',
    ],
  },
  stay_online: {
    title: 'STAY ONLINE',
    lines: ['04:13', 'NANA — online', 'REN_17 — online', 'Остальные контакты: offline.', 'В комнате единственный источник света — монитор.'],
  },
  user_not_found: {
    title: 'USER NOT FOUND',
    lines: ['Профиль REN_17 исчез.', 'Никакого объяснения. Никакого последнего сообщения.', 'Нана ещё несколько недель открывает «Сообщения» по привычке.', 'Она никогда не узнает, куда он пропал.'],
  },
  meet_me: {
    title: 'MEET ME',
    lines: [
      'Он не похож на свои фотографии.',
      'Он ниже, тише и всё время трогает очки.',
      'Первые пять минут — очень неловкие.',
      'Потом он говорит: «Ты тоже не похожа. Ты лучше». И Нана не знает, что ответить.',
      'Они идут за кофе. Оба немного влюблены не друг в друга, а в тех, кого придумали. Но идут.',
    ],
  },
  meet_me_left: {
    title: 'MEET ME',
    lines: [
      'Нана разворачивается.',
      'В электричке она смотрит на его последнее сообщение: «серая куртка».',
      'Она не отвечает. Он не пишет.',
      'Через неделю она понимает, что скучает не по нему. А по тому, кем он был в окне сообщений.',
    ],
  },
  log_off: {
    title: 'LOG OFF',
    lines: ['Нана выключает компьютер.', 'Не потому что решила. Просто устала.', 'Маю не пишет неделю. Потом пишет «✌🏻». Нана отвечает через день.', 'Иногда этого достаточно, чтобы начать снова.'],
  },
  balance: {
    title: 'ONLINE / OFFLINE',
    lines: [
      'Нана не бросает Рэна.',
      'Она пишет ему вечером, как обещала. Коротко. Потом идёт спать.',
      'Утром на рабочем столе — одна новая фотография с моря. Термос пустой. Маю с закрытыми глазами.',
      'REN_17 — offline. И это нормально.',
      '',
      'Человек не должен становиться всей твоей жизнью.',
    ],
  },
};
