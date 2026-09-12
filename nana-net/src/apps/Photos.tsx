import { useState } from 'react';
import { useGameState, type WindowState } from '../state/store';
import { availablePhotos, photoDef, renderPhoto } from '../story/photos';

export function Photos({ win }: { win: WindowState }) {
  const s = useGameState();
  const list = availablePhotos(s);
  const [cur, setCur] = useState<string>((win.props?.photo as string | undefined) ?? list[0]);
  const def = photoDef(cur);
  return (
    <div className="photos">
      <div className="photos-list">
        {list.map((p) => (
          <img key={p} className={`clickable ${p === cur ? 'active' : ''}`} src={renderPhoto(p, 150, 100)} alt="" onClick={() => setCur(p)} title={photoDef(p).title} />
        ))}
      </div>
      <div className="photos-view">
        <img src={renderPhoto(cur, 640, 480)} alt={def.title} />
        <div>
          {def.file} · {def.title}
          {def.folder === 'ren' && s.flags.doubt ? ' · свет не совпадает' : ''}
        </div>
      </div>
    </div>
  );
}

export function ImageView({ win }: { win: WindowState }) {
  const photo = (win.props?.photo as string) ?? 'sky_1';
  const s = useGameState();
  const def = photoDef(photo);
  return (
    <div className="photos">
      <div className="photos-view" style={{ background: '#2b2f36' }}>
        <img src={renderPhoto(photo, 640, 480)} alt={def.title} />
        <div>
          {def.file} · {def.title}
          {def.folder === 'ren' && s.flags.doubt ? ' · свет не совпадает' : ''}
        </div>
      </div>
    </div>
  );
}
