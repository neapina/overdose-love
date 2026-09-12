import type { WindowState } from '../state/store';
import { Explorer } from './Explorer';
import { Notepad } from './Notepad';
import { ImageView, Photos } from './Photos';
import { Music } from './Music';
import { Meromero } from './Meromero';
import { Homework } from './Homework';
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
    case 'meromero':
      return <Meromero win={win} />;
    case 'homework':
      return <Homework />;
    case 'paint':
      return <Paint />;
    case 'personalize':
      return <Personalize />;
  }
}
