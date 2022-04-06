import { useState } from '../extend/hooks';
import * as R from 'ramda';
import { hasOwnProperty, isPlainObject } from '../utils';

export default function handleMapState(mapState) {
  const state = useState();
  const ownState = {};
  for (let i = 0, len = mapState.length; i < len; i++) {
    const curr = mapState[i];
    switch (typeof curr) {
      case 'string': {
        if (hasOwnProperty.call(state, curr)) {
          ownState[curr] = state[curr];
        }
        break;
      }
      case 'function': {
        const funcResult = R.tryCatch(curr, R.always(undefined))(state);
        if (isPlainObject(funcResult)) {
          Object.assign(ownState, funcResult);
        }
        break;
      }
    }
  }
  return ownState;
}
