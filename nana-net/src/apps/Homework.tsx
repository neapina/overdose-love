import { useState } from 'react';
import { isAfternoon, setState, stage, think, toast, useGameState } from '../state/store';
import { homeworkFor, testVerdict, type HomeworkTask } from '../story/school';
import { playSound } from '../os/sounds';

export function Homework() {
  const s = useGameState();
  const tasks = homeworkFor(s);
  const [openId, setOpenId] = useState<string | null>(null);
  const task = tasks.find((t) => t.id === openId);
  const left = tasks.filter((t) => !s.homeworkDone.includes(t.id));
  const st = stage(s);

  if (task && !s.homeworkDone.includes(task.id)) {
    return <TaskView task={task} onDone={() => setOpenId(null)} />;
  }

  return (
    <div className="hw">
      <div className="hw-head">
        <img src="/assets/mm/book.png" alt="" />
        <div>
          <b>Дневник · день {s.day}</b>
          <div className="hw-sub">
            {tasks.length === 0 ? (st >= 2 ? 'заданий нет. или я их не записала.' : 'на завтра ничего не задали.') : left.length === 0 ? 'всё сделано ✓' : `осталось: ${left.length} из ${tasks.length}`}
          </div>
        </div>
        <div className="hw-score" title="как идёт учёба">
          {s.school >= 8 ? 'A' : s.school >= 5 ? 'B' : s.school >= 2 ? 'C' : s.day === 1 ? '—' : 'D'}
        </div>
      </div>
      <div className="hw-list">
        {tasks.map((t) => {
          const done = s.homeworkDone.includes(t.id);
          return (
            <div key={t.id} className={`hw-item ${done ? 'done' : 'clickable'}`} role={done ? undefined : 'button'} onClick={() => !done && (playSound('click'), setOpenId(t.id))}>
              <img src={done ? '/assets/mm/check-on.png' : '/assets/mm/check-off.png'} alt="" />
              <div style={{ flex: 1 }}>
                <b>{t.subject}</b> — {t.title}
                <div className="hw-sub">{t.due}</div>
              </div>
              <span className="hw-kind">{t.kind === 'test' ? `тест · ${t.questions?.length ?? 0} вопр.` : 'эссе'}</span>
            </div>
          );
        })}
      </div>
      <div className="hw-foot">
        {!isAfternoon(s) && left.length > 0 && <span>уже вечер. {st >= 2 ? 'голова не здесь.' : 'ну можно и сейчас.'}</span>}
        {isAfternoon(s) && left.length > 0 && <span>лучше до вечера — потом все выйдут в сеть.</span>}
        {left.length === 0 && tasks.length > 0 && <span>{st >= 2 ? 'сделано. можно не думать.' : 'сделано. вечер свободен.'}</span>}
      </div>
    </div>
  );
}

function TaskView({ task, onDone }: { task: HomeworkTask; onDone: () => void }) {
  const s = useGameState();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const st = stage(s);
  const total = task.kind === 'test' ? task.questions!.length : task.essay!.length;

  function finish(score: number) {
    const gain = task.kind === 'essay' ? 1.5 : (score / total) * 2;
    playSound('notify');
    setState((stt) => ({
      homeworkDone: [...stt.homeworkDone, task.id],
      school: stt.school + gain,
      clock: stt.clock + (isAfternoon(stt) ? 35 : 20),
      flags: { ...stt.flags, [`hw_${task.id}`]: true, [`hw_done_d${stt.day}`]: true },
    }));
    setFinished(true);
    if (task.kind === 'test') think(testVerdict(score, total, s));
    else think(st >= 2 ? 'написала. половина — не про то, о чём спрашивали.' : 'написала. учительница любит слово «ordinary». я — нет.');
    toast('Уроки', `${task.subject}: ${task.kind === 'test' ? `${score}/${total}` : 'эссе сдано'}`, '/assets/mm/book.png', { app: 'homework' });
  }

  if (finished) {
    return (
      <div className="hw">
        <div className="hw-head">
          <img src="/assets/mm/check-on.png" alt="" />
          <div>
            <b>
              {task.subject} — {task.title}
            </b>
            <div className="hw-sub">{task.kind === 'test' ? `результат: ${correct} из ${total}` : 'эссе сохранено в school/'}</div>
          </div>
        </div>
        <div className="hw-body center">
          <div className="hw-result">{task.kind === 'test' ? `${correct} / ${total}` : '✓'}</div>
          <button className="btn primary" onClick={() => (playSound('click'), onDone())}>
            К списку заданий
          </button>
        </div>
      </div>
    );
  }

  if (task.kind === 'test') {
    const q = task.questions![i];
    const answered = picked !== null;
    return (
      <div className="hw">
        <div className="hw-head">
          <img src="/assets/mm/book.png" alt="" />
          <div>
            <b>
              {task.subject} — {task.title}
            </b>
            <div className="hw-sub">
              вопрос {i + 1} из {total}
            </div>
          </div>
          <button className="btn" onClick={() => (playSound('click'), onDone())}>
            отложить
          </button>
        </div>
        <div className="hw-body">
          <div className={`hw-q ${st >= 3 ? 'shaky' : ''}`}>{q.q}</div>
          <div className="choices quiet hw-opts">
            {q.options.map((o, k) => (
              <button
                key={o}
                className={`choice ${answered ? (k === q.answer ? 'right' : k === picked ? 'wrong' : 'dim') : ''}`}
                disabled={answered}
                onClick={() => {
                  playSound('click');
                  setPicked(k);
                  if (k === q.answer) setCorrect((c) => c + 1);
                }}
              >
                {o}
              </button>
            ))}
          </div>
          {answered && (
            <button
              className="btn primary hw-next"
              onClick={() => {
                playSound('click');
                if (i + 1 >= total) finish(correct);
                else {
                  setI(i + 1);
                  setPicked(null);
                }
              }}
            >
              {i + 1 >= total ? 'Сдать' : 'Дальше →'}
            </button>
          )}
        </div>
      </div>
    );
  }

  const part = task.essay![i];
  return (
    <div className="hw">
      <div className="hw-head">
        <img src="/assets/mm/book.png" alt="" />
        <div>
          <b>
            {task.subject} — {task.title}
          </b>
          <div className="hw-sub">
            часть {i + 1} из {total}
          </div>
        </div>
        <button className="btn" onClick={() => (playSound('click'), onDone())}>
          отложить
        </button>
      </div>
      <div className="hw-body">
        <div className="hw-q">{part.prompt}</div>
        <div className="choices quiet hw-opts">
          {part.options.map((o) => (
            <button
              key={o.text}
              className="choice essay"
              onClick={() => {
                playSound('click');
                setState((stt) => ({
                  ren: stt.ren + (o.ren ?? 0),
                  mayu: stt.mayu + (o.mayu ?? 0),
                  flags: o.flag ? { ...stt.flags, [o.flag]: true } : stt.flags,
                }));
                if (i + 1 >= total) finish(total);
                else setI(i + 1);
              }}
            >
              {o.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
