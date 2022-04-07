import * as R from 'ramda';
import * as sagaEffects from 'redux-saga/effects';
import { getActionType, toActionType } from './action-type';

function createEffects(model) {
  function put(action) {
    const { type } = action;
    const actionTypeElements = getActionType(type);
    return sagaEffects.put({
      ...action,
      type: toActionType(actionTypeElements, model),
    });
  }
  function putResolve(action) {
    const { type } = action;
    const actionTypeElements = getActionType(type);
    return sagaEffects.put.resolve({
      ...action,
      type: toActionType(actionTypeElements, model),
    });
  }

  put.resolve = putResolve;

  function take(type) {
    if (R.is(Function, type)) return sagaEffects.take(type());
    if (typeof type === 'string') {
      return sagaEffects.take(toActionType(getActionType(type), model));
    } else if (Array.isArray(type)) {
      return sagaEffects.take(
        type.map((t) => {
          if (typeof t === 'string') {
            return toActionType(getActionType(t), model);
          }
          return t;
        })
      );
    } else {
      return sagaEffects.take(type);
    }
  }
  return { ...sagaEffects, put, take };
}

export default createEffects;