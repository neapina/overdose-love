import type { Conversation, Ending, Step } from './types';

const t = (h: number, m = 0) => h * 60 + m;
const r = (text: string, extra: Partial<Extract<Step, { type: 'msg' }>> = {}): Step => ({ type: 'msg', from: 'ren', text, ...extra });
const my = (text: string, extra: Partial<Extract<Step, { type: 'msg' }>> = {}): Step => ({ type: 'msg', from: 'mayu', text, ...extra });
const n = (text: string): Step => ({ type: 'msg', from: 'nana', text });
const sys = (text: string): Step => ({ type: 'msg', from: 'system', text });
const on = (c: 'ren' | 'mayu'): Step => ({ type: 'status', contact: c, online: true });
const off = (c: 'ren' | 'mayu'): Step => ({ type: 'status', contact: c, online: false });
const pause = (ms: number): Step => ({ type: 'pause', ms });

export const CONVERSATIONS: Conversation[] = [
  // ───────────────────────── DAY 1 ─────────────────────────
  {
    id: 'd1_mayu_hello',
    contact: 'mayu',
    channel: 'meromero',
    day: 1,
    at: t(19, 46),
    steps: [
      my('НАНА'),
      my('НАНА ТЫ ЗАРЕГАЛАСЬ НАКОНЕЦ'),
      my('я тебя уже нашла ✌🏻'),
      my('добавь меня в друзья быстрее, у меня на странице 0 друзей это стыдно'),
      { type: 'toast', title: 'meromero.net', text: 'Маю хочет добавить тебя в друзья' },
      {
        type: 'choice',
        options: [
          { text: 'добавила!! у тебя страница как торт', mayu: 2, then: [my('ЭТО КОМПЛИМЕНТ??'), my('ладно принимаю'), my('напиши что-нибудь в статус, а то у тебя пусто, как будто ты бот')] },
          { text: 'сейчас, я ещё оформляю', mayu: 1, then: [my('ок ок'), my('только не делай всё серое как обычно'), my('поставь розовое!!!')] },
        ],
      },
      my('и запости что-нибудь. ну хоть «привет»'),
    ],
  },
  {
    id: 'd1_ren_comment',
    contact: 'ren',
    channel: 'meromero',
    day: 1,
    at: t(20, 0),
    when: (s) => !!s.flags.posted,
    steps: [
      pause(9000),
      { type: 'comment', author: 'REN_17', text: 'я тоже постоянно не сплю ночью' },
      { type: 'toast', title: 'meromero.net', text: 'REN_17 прокомментировал(а) вашу запись', icon: '/assets/mm/notif-chat.png' },
      { type: 'set', flags: ['ren_commented'] },
    ],
  },
  {
    id: 'd1_mayu_cafe',
    contact: 'mayu',
    channel: 'meromero',
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
      off('mayu'),
    ],
  },
  {
    id: 'd1_ren_status',
    contact: 'ren',
    channel: 'meromero',
    day: 1,
    at: t(23, 40),
    when: (s) => !!s.flags.ren_commented,
    steps: [on('ren'), { type: 'toast', title: 'meromero.net', text: 'REN_17 сейчас на сайте', icon: '/assets/mm/dot-green.png' }],
  },
  {
    id: 'd1_ren_offline',
    contact: 'ren',
    channel: 'meromero',
    day: 1,
    at: t(25, 10),
    steps: [off('ren')],
  },

  // ───────────────────────── DAY 2 ─────────────────────────
  {
    id: 'd2_mayu_cafe_result_yes',
    contact: 'mayu',
    channel: 'meromero',
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
    ],
  },
  {
    id: 'd2_mayu_cafe_result_no',
    contact: 'mayu',
    channel: 'meromero',
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
    id: 'd2_ren_dm',
    contact: 'ren',
    channel: 'meromero',
    day: 2,
    at: t(21, 30),
    steps: [
      on('ren'),
      pause(4000),
      r('привет. это ren_17, я оставлял комментарий под твоим постом'),
      r('надеюсь не странно что пишу в личку'),
      r('просто у тебя в профиле песня стоит. я её слушал всё лето. думал, никто её не знает'),
      {
        type: 'choice',
        options: [
          { text: 'не странно. я тоже думала, что её никто не знает', ren: 2, then: [r('ха'), r('значит нас двое'), r('ты часто не спишь?')] },
          { text: 'привет. немного странно, но ладно', ren: 1, then: [r('честно. ценю'), r('ты часто не спишь?')] },
        ],
      },
      {
        type: 'choice',
        options: [
          { text: 'почти каждую ночь. днём всё какое-то громкое', ren: 2, flags: ['told_ren_night'], then: [r('да'), r('ночью как будто интернет только твой'), r('я тоже так думаю')] },
          { text: 'иногда. когда не могу выключить голову', ren: 1, then: [r('понимаю'), r('у меня то же самое')] },
        ],
      },
      r('слушай. тут на сайте личка постоянно теряет сообщения'),
      r('у меня есть мессенджер. m messenger, он маленький, ничего не весит'),
      r('если хочешь — вот ссылка. можно не ставить'),
      {
        type: 'choice',
        options: [
          {
            text: 'поставлю',
            ren: 2,
            flags: ['installed_messenger'],
            then: [
              r('ок. добавь ren_17'),
              { type: 'unlock', what: 'messenger' },
              sys('M Messenger установлен. Ярлык добавлен на рабочий стол.'),
              r('вижу тебя. привет ещё раз'),
              r('спокойной ночи, нана'),
            ],
          },
          {
            text: 'может позже',
            ren: 0,
            then: [r('конечно'), r('никакой спешки'), r('спокойной ночи')],
          },
        ],
      },
      pause(2000),
      off('ren'),
    ],
  },
  {
    id: 'd2_mayu_late',
    contact: 'mayu',
    channel: 'meromero',
    day: 2,
    at: t(23, 20),
    steps: [my('ты чего не спишь? я вижу зелёный кружок'), my('ложись. завтра контрольная'), off('mayu')],
  },

  // ───────────────────────── DAY 3 ─────────────────────────
  {
    id: 'd3_messenger_late_install',
    contact: 'ren',
    channel: 'meromero',
    day: 3,
    at: t(19, 42),
    when: (s) => !s.messengerInstalled,
    steps: [
      on('ren'),
      r('привет. я всё-таки скину ещё раз ссылку на мессенджер, тут половина твоих сообщений вчера не дошла'),
      { type: 'unlock', what: 'messenger' },
      { type: 'set', flags: ['installed_messenger'] },
      sys('M Messenger установлен. Ярлык добавлен на рабочий стол.'),
      off('ren'),
    ],
  },
  {
    id: 'd3_mayu_walk',
    contact: 'mayu',
    channel: 'meromero',
    day: 3,
    at: t(20, 15),
    steps: [
      on('mayu'),
      my('НАНА'),
      my('пошли сегодня вечером гулять!!! у реки фонари включили, там красиво'),
      my('через полчаса у твоего подъезда?'),
    ],
  },
  {
    id: 'd3_ren_evening',
    contact: 'ren',
    channel: 'messenger',
    day: 3,
    at: t(20, 22),
    steps: [
      on('ren'),
      r('ты сегодня будешь?'),
      r('я хотел с тобой поговорить'),
      r('ничего срочного. просто день был странный'),
      {
        type: 'choice',
        options: [
          {
            text: '[Пойти с Маю] напишу тебе как вернусь',
            mayu: 3,
            ren: -1,
            flags: ['d3_went_mayu'],
            then: [
              r('конечно. иди'),
              r('буду тут'),
              off('ren'),
              pause(2500),
              { type: 'post', author: 'mayu', text: 'фонари у реки + нана + мой новый фотик = ✌🏻', photo: 'river_nana' },
              { type: 'set', flags: ['photo_river'] },
              my('ЭТО БЫЛО ИДЕАЛЬНО'),
              my('ты почти улыбнулась на фотке. почти'),
              off('mayu'),
              pause(3000),
              on('ren'),
              r('вернулась?'),
              r('расскажешь как было?'),
              r('у меня просто отец опять. неважно. рад что ты вышла'),
              off('ren'),
            ],
          },
          {
            text: '[Остаться дома] я тут. рассказывай',
            ren: 3,
            mayu: -2,
            flags: ['d3_stayed'],
            then: [
              r('спасибо'),
              r('у меня дома опять шумно. отец. не важно'),
              r('просто хотел с кем-то нормальным поговорить'),
              r('с тобой тихо. в хорошем смысле'),
              pause(2000),
              my('нана?'),
              my('ты идёшь или нет'),
              my('ладно. одна пойду'),
              off('mayu'),
              r('я тебе кое-что покажу. только не смейся'),
              r('это я', { photo: 'ren_1' }),
              { type: 'set', flags: ['ren_photo1'] },
              {
                type: 'choice',
                options: [
                  { text: 'не смеюсь. у тебя доброе лицо', ren: 2, then: [r('…'), r('никто мне так не говорил'), r('спокойной ночи, нана')] },
                  { text: 'фото какое-то тёмное. где это?', ren: 0, flags: ['noticed_photo1'], then: [r('это дома. лампа плохая'), r('ладно. спокойной ночи')] },
                ],
              },
              off('ren'),
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'd3_ren_photo_if_went',
    contact: 'ren',
    channel: 'messenger',
    day: 3,
    at: t(24, 40),
    when: (s) => !!s.flags.d3_went_mayu,
    steps: [
      on('ren'),
      r('ещё не спишь?'),
      r('я тебе кое-что покажу. только не смейся'),
      r('это я', { photo: 'ren_1' }),
      { type: 'set', flags: ['ren_photo1'] },
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

  // ───────────────────────── DAY 4 ─────────────────────────
  {
    id: 'd4_mayu_morning',
    contact: 'mayu',
    channel: 'messenger',
    day: 4,
    at: t(19, 44),
    steps: [
      on('mayu'),
      my('нана ты сегодня выйдешь?'),
      my('я в магазине рядом с тобой, тут продают те булочки с мацу тя'),
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
    id: 'd4_ren_wait',
    contact: 'ren',
    channel: 'messenger',
    day: 4,
    at: t(21, 0),
    steps: [
      sys('REN_17 не в сети'),
    ],
  },
  {
    id: 'd4_ren_late',
    contact: 'ren',
    channel: 'messenger',
    day: 4,
    at: t(25, 15),
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
        ],
      },
      r('можно попросить? отправь мне свою фотографию. любую. с вебки'),
      r('я просто хочу знать, с кем говорю'),
      {
        type: 'choice',
        options: [
          {
            text: 'сейчас. секунду',
            ren: 2,
            flags: ['asked_photo'],
            then: [sys('Откройте «Камера», сделайте снимок и отправьте его в чат.')],
          },
          {
            text: 'не сейчас. я ужасно выгляжу в 1:20 ночи',
            ren: -1,
            mayu: 1,
            then: [r('ты не можешь ужасно выглядеть'), r('ладно. когда захочешь')],
          },
        ],
      },
      r('я скинул тебе одну песню. она в загрузках'),
      { type: 'set', flags: ['ren_song'] },
      r('послушай когда меня не будет'),
      off('ren'),
    ],
  },

  // ───────────────────────── DAY 5 ─────────────────────────
  {
    id: 'd5_mayu',
    contact: 'mayu',
    channel: 'messenger',
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
    channel: 'messenger',
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
    id: 'd5_ren_photo2',
    contact: 'ren',
    channel: 'messenger',
    day: 5,
    at: t(22, 40),
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
            text: 'красиво… но у тебя на этом фото другая причёска, чем на первом',
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
                  { text: 'нет. просто скажи, когда фото старое', ren: 1, then: [r('хорошо'), r('обещаю')] },
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
          { text: 'только если я не буду ждать этого', ren: 1, mayu: 1, then: [r('ты умнее меня'), r('спокойной ночи')] },
        ],
      },
      off('ren'),
      { type: 'wallpaper', value: 'dusk' },
    ],
  },

  // ───────────────────────── DAY 6 ─────────────────────────
  {
    id: 'd6_mayu_silence',
    contact: 'mayu',
    channel: 'messenger',
    day: 6,
    at: t(19, 50),
    when: (s) => s.mayu < 8,
    steps: [my('окей'), off('mayu')],
  },
  {
    id: 'd6_mayu_ok',
    contact: 'mayu',
    channel: 'messenger',
    day: 6,
    at: t(19, 50),
    when: (s) => s.mayu >= 8,
    steps: [
      on('mayu'),
      my('я распечатала ту фотку с реки. повесила над столом'),
      my('ты там как будто из другого времени'),
      my('завтра в 9 у станции. термос!!!'),
      off('mayu'),
    ],
  },
  {
    id: 'd6_ren_conflict',
    contact: 'ren',
    channel: 'messenger',
    day: 6,
    at: t(22, 10),
    when: (s) => !!s.flags.doubt_strong,
    steps: [
      on('ren'),
      r('привет'),
      r('ты вчера сказала «всё странно». я думал об этом весь день'),
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
          {
            text: 'неважно. я просто устала вчера',
            ren: 2,
            then: [r('хорошо'), r('я боялся'), r('спокойной ночи, нана')],
          },
        ],
      },
      off('ren'),
    ],
  },
  {
    id: 'd6_ren_meet',
    contact: 'ren',
    channel: 'messenger',
    day: 6,
    at: t(22, 10),
    when: (s) => !s.flags.doubt_strong,
    steps: [
      on('ren'),
      r('нана'),
      r('я думал весь день'),
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
    channel: 'messenger',
    day: 6,
    at: t(26, 30),
    when: (s) => !!s.flags.need_time,
    steps: [
      sys('Контакт REN_17 больше не существует'),
      { type: 'set', flags: ['ren_gone'] },
      { type: 'toast', title: 'M Messenger', text: 'Пользователь не найден', icon: '/assets/mm/dot-grey.png' },
      { type: 'wallpaper', value: 'night' },
    ],
  },

  // ───────────────────────── DAY 7 ─────────────────────────
  {
    id: 'd7_gone_ending',
    contact: 'ren',
    channel: 'messenger',
    day: 7,
    at: t(19, 45),
    when: (s) => !!s.flags.ren_gone,
    steps: [
      sys('REN_17 — пользователь не найден'),
      pause(3000),
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
    channel: 'messenger',
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
    id: 'd7_final',
    contact: 'ren',
    channel: 'messenger',
    day: 7,
    at: t(19, 45),
    when: (s) => !s.flags.meet_agreed && !s.flags.ren_gone,
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
            text: '[Закрыть Messenger и выйти к Маю]',
            mayu: 3,
            flags: ['final_mayu'],
            then: [
              n('рэн, я пойду. напишу позже. может быть'),
              r('…'),
              r('хорошо'),
              off('ren'),
              my('ВИЖУ ТЕБЯ'),
              pause(2000),
              { type: 'end', ending: 'mayu' },
            ],
          },
          {
            text: '[Остаться. Написать Маю «не сегодня»]',
            ren: 3,
            flags: ['final_ren'],
            then: [
              my('окей'),
              off('mayu'),
              r('она обидится?'),
              n('нет. она привыкла'),
              r('спасибо, что осталась'),
              r('я тут. всегда'),
              pause(2500),
              { type: 'end', ending: 'stay_online' },
            ],
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
];

export const ENDINGS: Record<string, Ending> = {
  mayu: {
    title: 'MAYU',
    lines: [
      'Нана закрывает Messenger.',
      'На улице холодно и пахнет дождём. Маю уже машет с другой стороны дороги.',
      'Финальная фотография этого дня — ужасного качества. Размытая. Пересвеченная. Маю смеётся, Нана почти улыбается.',
      'Именно поэтому она выглядит самой настоящей.',
    ],
  },
  stay_online: {
    title: 'STAY ONLINE',
    lines: [
      '04:13',
      'NANA — online',
      'REN_17 — online',
      'Остальные контакты: offline.',
      'В комнате единственный источник света — монитор.',
    ],
  },
  user_not_found: {
    title: 'USER NOT FOUND',
    lines: [
      'Профиль REN_17 исчез.',
      'Никакого объяснения. Никакого последнего сообщения.',
      'Нана ещё несколько недель открывает Messenger по привычке.',
      'Она никогда не узнает, куда он пропал.',
    ],
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
      'Через неделю она понимает, что скучает не по нему. А по тому, кем он был в окне Messenger.',
    ],
  },
  log_off: {
    title: 'LOG OFF',
    lines: ['Нана постепенно ограничивает разговоры.', 'Рэн остаётся важным человеком, но перестаёт быть всей её жизнью.'],
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
