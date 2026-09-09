import { stage, type GameState } from '../state/store';

export interface Question {
  q: string;
  options: string[];
  /** index of the right option; -1 = no right answer (essay-like) */
  answer: number;
}

export interface EssayPart {
  prompt: string;
  options: { text: string; ren?: number; mayu?: number; flag?: string }[];
}

export interface HomeworkTask {
  id: string;
  subject: string;
  title: string;
  due: string;
  kind: 'test' | 'essay';
  questions?: Question[];
  essay?: EssayPart[];
}

const q = (qq: string, options: string[], answer: number): Question => ({ q: qq, options, answer });

const ENGLISH_1: Question[] = [
  q('She ___ to school every day.', ['go', 'goes', 'going', 'gone'], 1),
  q('I ___ my homework yesterday.', ['do', 'did', 'done', 'doing'], 1),
  q('Choose the correct word: "My ordinary day ___ boring."', ['am', 'are', 'is', 'be'], 2),
  q('We ___ to the cafe after school.', ['goed', 'went', 'gone', 'go'], 1),
  q('"Nice to meet you" — как ответить?', ['Nice to meet you too', 'I am fine', 'Yes, please', 'See you'], 0),
];

const MATH_1: Question[] = [
  q('2x + 6 = 14. x = ?', ['3', '4', '5', '10'], 1),
  q('Площадь круга радиуса 3:', ['3π', '6π', '9π', '12π'], 2),
  q('sin 30° = ?', ['0', '1/2', '√2/2', '1'], 1),
  q('(a + b)² = ?', ['a² + b²', 'a² + 2ab + b²', 'a² − 2ab + b²', '2a + 2b'], 1),
];

const HISTORY_2: Question[] = [
  q('Период Эдо начался в…', ['1185', '1603', '1868', '1945'], 1),
  q('Столицей в период Хэйан был…', ['Нара', 'Камакура', 'Киото', 'Эдо'], 2),
  q('Реставрация Мэйдзи — это…', ['1603', '1868', '1912', '1926'], 1),
  q('Сёгун — это…', ['император', 'военный правитель', 'монах', 'поэт'], 1),
];

const LIT_3: Question[] = [
  q('«Повесть о Гэндзи» написала…', ['Мурасаки Сикибу', 'Сэй-Сёнагон', 'Басё', 'Акутагава'], 0),
  q('Хайку — это…', ['5-7-5', '7-7-7', '5-5-5', '3-5-3'], 0),
  q('Автор «Записок у изголовья»:', ['Мурасаки Сикибу', 'Сэй-Сёнагон', 'Кавабата', 'Дадзай'], 1),
  q('«Исповедь „неполноценного“ человека» написал…', ['Дадзай Осаму', 'Мисима', 'Мураками', 'Танидзаки'], 0),
];

const BIO_4: Question[] = [
  q('Митохондрии — это…', ['энергия клетки', 'ядро', 'оболочка', 'рибосома'], 0),
  q('ДНК находится в…', ['цитоплазме', 'ядре', 'мембране', 'вакуоли'], 1),
  q('Сколько часов сна нужно подростку?', ['4–5', '6', '8–10', '12'], 2),
  q('Фотосинтез происходит в…', ['митохондриях', 'хлоропластах', 'ядре', 'лизосомах'], 1),
];

const ENGLISH_5: Question[] = [
  q('I ___ for his message all night.', ['wait', 'waited', 'am waiting', 'was waiting'], 3),
  q('"You are the only one who ___ me."', ['understand', 'understands', 'understanding', 'understood'], 1),
  q('She ___ asleep at the desk.', ['fall', 'fell', 'fallen', 'falls'], 1),
  q('We ___ met in real life.', ['never have', 'have never', 'never', 'had never yet'], 1),
  q('Nobody ___ online.', ['are', 'be', 'is', 'were'], 2),
];

const MATH_6: Question[] = [
  q('Если он online в 22:30 и пишет в 01:47, сколько прошло?', ['2 ч 17 мин', '3 ч 17 мин', '3 ч 47 мин', 'неважно'], 1),
  q('Если спать 3 часа в сутки 6 дней, сколько это всего?', ['12', '18', '24', 'мало'], 1),
  q('x² = 49. x = ?', ['7', '−7', '±7', '49'], 2),
  q('Вероятность того, что он напишет сегодня:', ['0', '1/2', '1', 'нельзя посчитать'], 3),
];

function essayOrdinaryDay(s: GameState): EssayPart[] {
  const st = stage(s);
  return [
    {
      prompt: 'Абзац 1 — утро.',
      options: [
        { text: 'I wake up at seven. My mother makes breakfast. I am late anyway.' },
        { text: 'I wake up before the alarm. The room is grey. I check my phone first.', ren: st >= 1 ? 1 : 0 },
        { text: 'Mayu calls me on the way to school. She talks, I listen. I like it.', mayu: 1 },
      ],
    },
    {
      prompt: 'Абзац 2 — школа.',
      options: [
        { text: 'Classes are long. I look out of the window. Mayu passes me notes.', mayu: 1 },
        { text: 'I like English. I do not like math. Lunch is the best part.' },
        ...(st >= 1 ? [{ text: 'In class I think about a message I got last night. I do not know why.', ren: 1, flag: 'essay_ren' }] : []),
      ],
    },
    {
      prompt: 'Абзац 3 — вечер.',
      options: [
        { text: 'In the evening I go online. My friend is there. We talk about nothing.', mayu: 1 },
        { text: 'In the evening I sit at my computer. Time goes fast there.' },
        ...(st >= 2 ? [{ text: 'At night the internet is quiet and honest. Someone is always awake with me.', ren: 2, flag: 'essay_night' }] : []),
      ],
    },
  ];
}

function essayFriend(s: GameState): EssayPart[] {
  const st = stage(s);
  return [
    {
      prompt: '«Мой друг» — кто это?',
      options: [
        { text: 'My best friend is Mayu. We have known each other since we were six.', mayu: 2 },
        { text: 'My friend is someone I met online. I have never seen his face.', ren: 2, flag: 'essay_friend_ren' },
        ...(st >= 2 ? [{ text: 'I am not sure I have friends. I have people who write to me.', ren: 1 }] : []),
      ],
    },
    {
      prompt: 'Что вы делаете вместе?',
      options: [
        { text: 'We eat pancakes and take bad photos. She laughs at my face.', mayu: 1 },
        { text: 'We talk at night. He listens to the same music as me.', ren: 1 },
        { text: 'Nothing special. That is the point.' },
      ],
    },
  ];
}

/** what Nana has to do today (afternoon) */
export function homeworkFor(s: GameState): HomeworkTask[] {
  switch (s.day) {
    case 1:
      return [
        { id: 'd1_eng', subject: 'Английский', title: 'Unit 7 — тест', due: 'на завтра', kind: 'test', questions: ENGLISH_1 },
        { id: 'd1_math', subject: 'Математика', title: '№ 214–218', due: 'на завтра', kind: 'test', questions: MATH_1 },
      ];
    case 2:
      return [
        { id: 'd2_hist', subject: 'История', title: 'Эдо — Мэйдзи, повторение', due: 'контрольная в четверг', kind: 'test', questions: HISTORY_2 },
        { id: 'd2_essay', subject: 'Английский', title: 'Эссе «My ordinary day»', due: 'до пятницы', kind: 'essay', essay: essayOrdinaryDay(s) },
      ];
    case 3:
      return [
        { id: 'd3_lit', subject: 'Литература', title: 'Хэйан — тест', due: 'на завтра', kind: 'test', questions: LIT_3 },
        { id: 'd3_math', subject: 'Математика', title: '№ 240–243', due: 'на завтра', kind: 'test', questions: MATH_1.slice(1) },
      ];
    case 4:
      return [
        { id: 'd4_bio', subject: 'Биология', title: 'Клетка — тест', due: 'на завтра', kind: 'test', questions: BIO_4 },
        { id: 'd4_essay', subject: 'Английский', title: 'Эссе «My friend»', due: 'до понедельника', kind: 'essay', essay: essayFriend(s) },
      ];
    case 5:
      return [{ id: 'd5_eng', subject: 'Английский', title: 'Unit 8 — тест', due: 'на завтра', kind: 'test', questions: ENGLISH_5 }];
    case 6:
      return [{ id: 'd6_math', subject: 'Математика', title: 'подготовка к контрольной', due: 'на завтра', kind: 'test', questions: MATH_6 }];
    default:
      return [];
  }
}

export function homeworkLeft(s: GameState) {
  return homeworkFor(s).filter((t) => !s.homeworkDone.includes(t.id));
}

/** Nana's comment after a finished test */
export function testVerdict(correct: number, total: number, s: GameState) {
  const st = stage(s);
  const ratio = correct / total;
  if (ratio === 1) return st >= 2 ? 'всё правильно. руки помнят. голова где-то ещё.' : 'всё правильно. маю бы сказала «зубрилка».';
  if (ratio >= 0.6) return st >= 2 ? 'сойдёт. всё равно завтра никто не проверит.' : 'нормально. сойдёт.';
  return st >= 2 ? 'плохо. неважно.' : 'плохо. надо было читать, а не сидеть в сети.';
}
