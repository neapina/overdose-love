import { openWindow } from '../state/windows';
import type { FsNode } from '../story/fs';
import { photoDef } from '../story/photos';

export function openNode(node: FsNode, path: string[]) {
  switch (node.kind) {
    case 'folder':
      openWindow('explorer', { path: [...path, node.name] }, node.name);
      break;
    case 'txt':
      openWindow('notepad', { content: node.content ?? '', name: node.name }, `${node.name} — Блокнот`);
      break;
    case 'image':
      openWindow('imageview', { photo: node.photo }, `${photoDef(node.photo!).file} — Просмотр фотографий`);
      break;
    case 'audio':
      openWindow('music', { play: node.name.replace(/\.mp3$/, '') });
      break;
    case 'app':
    case 'link':
      if (node.app) openWindow(node.app, node.props, node.app === 'explorer' && node.props?.path ? (node.props.path as string[]).at(-1) : undefined);
      break;
  }
}
