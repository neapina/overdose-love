import { useMemo, useState } from 'react';
import { useGameState, type WindowState } from '../state/store';
import { setWindowTitle } from '../state/windows';
import { buildFs, resolvePath, type FsNode } from '../story/fs';
import { renderPhoto } from '../story/photos';
import { openNode } from '../os/open';
import { openOn } from '../os/viewport';

export function Explorer({ win }: { win: WindowState }) {
  const s = useGameState();
  const fs = useMemo(() => buildFs(s), [s]);
  const initial = (win.props?.path as string[] | undefined) ?? ['Компьютер'];
  const [path, setPath] = useState<string[]>(initial.length ? initial : ['Компьютер']);
  const [hist, setHist] = useState<string[][]>([]);
  const node = resolvePath(fs, path) ?? fs;

  function go(p: string[]) {
    setHist((h) => [...h, path]);
    setPath(p);
    setWindowTitle(win.id, p.at(-1)!);
  }
  function back() {
    const prev = hist.at(-1);
    if (!prev) return;
    setHist((h) => h.slice(0, -1));
    setPath(prev);
    setWindowTitle(win.id, prev.at(-1)!);
  }
  function open(n: FsNode) {
    if (n.kind === 'folder') go([...path, n.name]);
    else openNode(n, path);
  }

  const items = node.children ?? [];
  return (
    <>
      <div className="toolbar">
        <button className="navbtn" onClick={back} disabled={!hist.length} title="Назад">
          ‹
        </button>
        <button className="navbtn" disabled title="Вперёд">
          ›
        </button>
        <div className="addr">
          {path.map((p, i) => (
            <span key={i} className="crumb clickable" role="button" onClick={() => go(path.slice(0, i + 1))}>
              {p}
              {i < path.length - 1 ? ' ▸' : ''}
            </span>
          ))}
        </div>
        <input className="input" placeholder="Поиск" style={{ width: 120 }} readOnly />
      </div>
      <div className="explorer">
        <div className="explorer-side">
          {fs.children!.map((c) => (
            <div key={c.name} className={`clickable ${path[1] === c.name ? 'active' : ''}`} role="button" onClick={() => go(['Компьютер', c.name])}>
              <img src={c.icon} alt="" />
              {c.name}
            </div>
          ))}
        </div>
        <div className={`explorer-main ${items.length ? '' : 'empty'}`}>
          {items.map((n, i) => (
            <div key={`${n.name}_${i}`} className="fitem clickable" role="button" {...openOn(() => open(n))}>
              {n.kind === 'image' ? <img className="thumb" src={renderPhoto(n.photo!, 112, 84)} alt="" /> : <img src={n.icon} alt="" />}
              <span>{n.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="statusbar">
        <span>Элементов: {items.length}</span>
        {node.kind === 'folder' && node.name === 'Корзина' && items.length > 0 && <span>Корзина не очищалась {s.day} дн.</span>}
      </div>
    </>
  );
}
