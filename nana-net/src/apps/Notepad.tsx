import { useState } from 'react';
import { setState, type WindowState } from '../state/store';
import { setWindowTitle } from '../state/windows';
import { playSound } from '../os/sounds';

export function Notepad({ win }: { win: WindowState }) {
  const [text, setText] = useState((win.props?.content as string | undefined) ?? '');
  const [dirty, setDirty] = useState(false);
  const name = (win.props?.name as string | undefined) ?? 'Безымянный';

  function save() {
    setDirty(false);
    setWindowTitle(win.id, `${name} — Блокнот`);
    playSound('click');
    if (text.trim().length > 20) setState((s) => ({ flags: { ...s.flags, wrote_note: true } }));
  }

  return (
    <>
      <div className="menubar">
        <span className="clickable" role="button" onClick={save}>
          Файл
        </span>
        <span>Правка</span>
        <span>Формат</span>
        <span>Вид</span>
        <span>Справка</span>
      </div>
      <textarea
        className="notepad"
        value={text}
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value);
          if (!dirty) {
            setDirty(true);
            setWindowTitle(win.id, `*${name} — Блокнот`);
          }
        }}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            save();
          }
        }}
      />
      <div className="statusbar">
        <span>Стр {text.split('\n').length}</span>
        <span>{dirty ? 'не сохранено · Ctrl+S' : 'сохранено'}</span>
      </div>
    </>
  );
}
