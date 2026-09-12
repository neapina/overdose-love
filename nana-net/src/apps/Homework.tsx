import { useState } from 'react';
import { isAfternoon, setState, stage, think, toast, useGameState } from '../state/store';
import { homeworkFor, testVerdict, type HomeworkTask } from '../story/school';
import { playSound } from '../os/sounds';
import { px } from '../os/pixel';

const WEEKDAY = ['чт', 'пт', 'сб', 'вс', 'пн', 'вт', 'ср'];

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
        <img src={px('/assets/mm/book.png')} alt="" />
        <div>
          <b>
            дневник · {WEEKDAY[(s.day - 1) % 7]} {12 + s.day}.10
          </b>
          <div className="hw-sub">
            {tasks.length === 0 ? (st >= 2 ? 'ничего не записано. или не задали' : 'на завтра ничего') : left.length === 0 ? 'всё' : 'на завтра'}
          </div>
        </div>
        <div className="hw-score" title="оценки за неделю">
          {s.school >= 8 ? 'A' : s.school >= 5 ? 'B' : s.school >= 2 ? 'C' : s.day === 1 ? '—' : 'D'}
        </div>
      </div>
      <div className="hw-list">
        {tasks.map((t) => {
          const done = s.homeworkDone.includes(t.id);
          return (
            <div key={t.id} className={`hw-item ${done ? 'done' : 'clickable'}`} role={done ? undefined : 'button'} onClick={() => !done && (playSound('click'), setOpenId(t.id))}>
              <span className="hw-box">{done ? '✓' : ''}</span>
              <div style={{ flex: 1 }}>
                <b>{t.subject.toLowerCase()}</b> — {t.title}
                <div className="hw-sub">{t.due}</div>
              </div>
              <span className="hw-kind">{t.kind === 'test' ? `тест, ${t.questions?.length ?? 0} вопр.` : 'эссе'}</span>
            </div>
          );
        })}
      </div>
      <div className="hw-foot">
        {!isAfternoon(s) && left.length > 0 && <span>{st >= 2 ? 'поздно уже. голова не тут' : 'вечер уже. ну ладно, быстро'}</span>}
        {isAfternoon(s) && left.length > 0 && <span>пока все в школе / на кружках — тишина. самое время</span>}
        {left.length === 0 && tasks.length > 0 && <span>{st >= 2 ? 'всё. можно не думать' : 'всё. вечер мой'}</span>}
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
    else think(st >= 2 ? 'написала. половина вообще не про то. ну и ладно' : 'написала. танака-сенсей обожает слово ordinary. я не очень');
    toast('уроки', `${task.subject.toLowerCase()} — ${task.kind === 'test' ? `${score}/${total}` : 'эссе готово'}`, '/assets/mm/book.png', { app: 'homework' });
  }

  if (finished) {
    return (
      <div className="hw">
        <div className="hw-head">
          <img src={px('/assets/mm/book.png')} alt="" />
          <div>
            <b>
              {task.subject.toLowerCase()} — {task.title}
            </b>
            <div className="hw-sub">{task.kind === 'test' ? `${correct} из ${total}` : 'сохранила в school/'}</div>
          </div>
        </div>
        <div className="hw-body center">
          <div className="hw-result">{task.kind === 'test' ? `${correct} / ${total}` : 'готово'}</div>
          <button className="btn" onClick={() => (playSound('click'), onDone())}>
            закрыть тетрадь
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
          <img src={px('/assets/mm/book.png')} alt="" />
          <div>
            <b>
              {task.subject.toLowerCase()} — {task.title}
            </b>
            <div className="hw-sub">
              {i + 1} / {total}
            </div>
          </div>
          <button className="btn" onClick={() => (playSound('click'), onDone())}>
            потом
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
              {i + 1 >= total ? 'сдать' : 'дальше →'}
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
        <img src={px('/assets/mm/book.png')} alt="" />
        <div>
          <b>
            {task.subject.toLowerCase()} — {task.title}
          </b>
          <div className="hw-sub">
            абзац {i + 1} / {total}
          </div>
        </div>
        <button className="btn" onClick={() => (playSound('click'), onDone())}>
          потом
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
