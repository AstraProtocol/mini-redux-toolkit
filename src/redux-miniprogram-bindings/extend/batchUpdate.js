import { getProvider } from '../provider';
import diff from './diff';
import { getKeys } from '../utils';

const queue = [];

export function batchUpdate({ id, data, setData }, updater) {
  const queueItem = queue.find((q) => q.id === id);
  if (queueItem) {
    Object.assign(queueItem.updater, updater);
  } else {
    queue.push({
      id,
      rootPath: getProvider().namespace,
      data: Object.assign({}, data),
      updater,
      setData,
    });
  }
  Object.assign(data, updater);
  Promise.resolve().then(update);
}
function update() {
  if (queue.length < 1) return;
  let queueItem;
  while ((queueItem = queue.shift())) {
    const diffData = diff(queueItem.updater, queueItem.data, queueItem.rootPath);
    if (getKeys(diffData).length > 0) {
      queueItem.setData(diffData);
    }
  }
}
