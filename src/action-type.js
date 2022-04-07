import * as R from 'ramda';
import { NAMESPACE_SEP } from './config';

function getActionType(type) {
  const parts = R.split(NAMESPACE_SEP, type);
  if (R.length(parts) === 3) {
    return {
      actionStatus: R.last(parts),
      actionType: R.path([1], parts),
      namespace: R.head(parts),
    };
  }
  if (R.length(parts) === 1) {
    return {
      namespace: null,
      actionType: R.head(parts),
      actionStatus: null,
    };
  }

  const actionStatus = R.find(R.includes('@@'), parts) || null;
  return {
    namespace: actionStatus ? null : R.head(parts),
    actionType: actionStatus ? R.head(parts) : R.last(parts),
    actionStatus,
  };
}

function toActionType({ namespace, actionType, actionStatus }, model) {
  const effectActionType = R.path(['asyncReducer', actionType], model);
  const reducerActionType = R.path(['reducer', actionType], model);
  if (effectActionType || reducerActionType)
    return R.join(
      NAMESPACE_SEP,
      [namespace || R.prop('namespace', model), actionType, actionStatus].filter(Boolean)
    );
  return R.join(NAMESPACE_SEP, [namespace, actionType, actionStatus].filter(Boolean));
}

export { toActionType, getActionType };
