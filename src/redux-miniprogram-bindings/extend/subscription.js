import { useSubscribe } from './hooks';
import { batchUpdate } from './batchUpdate';
import { isPlainObject, getKeys } from '../utils';

export default function subscription(context, mapState) {
  return useSubscribe((currState, prevState) => {
    const ownStateChanges = {};
    for (let i = 0, len = mapState.length; i < len; i++) {
      const curr = mapState[i];
      switch (typeof curr) {
        case 'string': {
          if (currState[curr] !== prevState[curr]) {
            ownStateChanges[curr] = currState[curr];
          }
          break;
        }
        case 'function': {
          const funcResult = curr(currState);
          if (isPlainObject(funcResult)) {
            Object.assign(ownStateChanges, funcResult);
          }
          break;
        }
      }
    }
    if (getKeys(ownStateChanges).length > 0) {
      batchUpdate(context, ownStateChanges);
    }
  });
}
