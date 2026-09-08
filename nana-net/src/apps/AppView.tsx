import type { WindowState } from '../state/store';
import { Explorer } from './Explorer';
import { Notepad } from './Notepad';
import { ImageView, Photos } from './Photos';
import { Music } from './Music';
import { Camera } from './Camera';
import { Meromero } from './Meromero';
import { Messenger } from './Messenger';
import { Paint } from './Paint';
import { Personalize } from './Personalize';

export function AppView({ win }: { win: WindowState }) {
  switch (win.app) {
    case 'explorer':
      return <Explorer win={win} />;
    case 'notepad':
      return <Notepad win={win} />;
    case 'photos':
      return <Photos win={win} />;
    case 'imageview':
      return <ImageView win={win} />;
    case 'music':
      return <Music win={win} />;
    case 'camera':
      return <Camera />;
    case 'meromero':
      return <Meromero win={win} />;
    case 'messenger':
      return <Messenger win={win} />;
    case 'paint':
      return <Paint />;
    case 'personalize':
      return <Personalize />;
  }
}
