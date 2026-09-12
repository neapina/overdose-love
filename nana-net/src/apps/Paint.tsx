import { useEffect, useRef, useState } from 'react';

const COLORS = ['#000000', '#7f7f7f', '#ffffff', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4', '#ffaec9', '#b97a57'];

export function Paint() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState('#ed1c24');
  const [size, setSize] = useState(4);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
  }, []);

  function pos(e: React.PointerEvent) {
    const r = ref.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * ref.current!.width, y: ((e.clientY - r.top) / r.height) * ref.current!.height };
  }

  return (
    <div className="paint">
      <div className="paint-tools">
        {COLORS.map((c) => (
          <div key={c} className={`sw clickable ${c === color ? 'active' : ''}`} role="button" style={{ background: c }} onClick={() => setColor(c)} />
        ))}
        <span style={{ marginLeft: 8, fontSize: 12 }}>Кисть</span>
        <input type="range" min={1} max={24} value={size} onChange={(e) => setSize(+e.target.value)} />
        <button
          className="btn"
          style={{ marginLeft: 'auto' }}
          onClick={() => {
            const ctx = ref.current!.getContext('2d')!;
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, ref.current!.width, ref.current!.height);
          }}
        >
          Очистить
        </button>
      </div>
      <canvas
        ref={ref}
        width={600}
        height={400}
        style={{ flex: 1, minHeight: 0, width: 'calc(100% - 16px)' }}
        onPointerDown={(e) => {
          drawing.current = true;
          last.current = pos(e);
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const p = pos(e);
          const ctx = ref.current!.getContext('2d')!;
          ctx.strokeStyle = color;
          ctx.lineWidth = size;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(last.current!.x, last.current!.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          last.current = p;
        }}
        onPointerUp={() => (drawing.current = false)}
      />
    </div>
  );
}
