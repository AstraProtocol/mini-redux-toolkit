import * as R from 'ramda';
import { takeLatest, throttle, takeEvery, put, call, take, race, delay } from 'redux-saga/effects';
import { NAMESPACE_SEP, CANCEL_EFFECT } from './config';
import { getActionType, toActionType } from './action-type';
import createEffects from './create-effects';

function from({ namespace, saga, key, ms, onError, onEffect, type, sagaEffects }) {
  return {
    namespace,
    saga,
    key,
    ms,
    onError,
    onEffect,
    type,
    sagaEffects,
    actionType: toActionType({ namespace, actionType: key }),
    sagaWithCatch: handlerWrapper(
      toActionType({ namespace, actionType: key }),
      saga,
      sagaEffects,
      onError
    ),
    sagaWithPolling: handlerWrapperPolling(
      toActionType({ namespace, actionType: key }),
      saga,
      ms,
      sagaEffects,
      onError
    ),
  };
}

function getSagaConfig(config) {
  const isArray = Array.isArray(config);
  const saga = isArray ? R.head(config) : config;
  const type = R.pathOr('takeEvery', [1, 'type'], config);
  const ms = R.pathOr(0, [1, 'ms'], config);

  return {
    ms,
    type,
    saga,
  };
}

function handlerWrapper(key, fn, _sagaEffects, onError) {
  return function* (...args) {
    try {
      yield put({ type: `${key}${NAMESPACE_SEP}@@start` });
      yield fn(...[...args, _sagaEffects]);
      yield put({ type: `${key}${NAMESPACE_SEP}@@end` });
    } catch (error) {
      onError(error, {
        key,
        effectArgs: args,
      });
    }
  };
}

function handlerWrapperPolling(key, fn, ms, _sagaEffects, onError) {
  function* worker(...args) {
    while (true) {
      try {
        yield put({ type: `${key}${NAMESPACE_SEP}@@start` });
        yield fn(...[...args, _sagaEffects]);
        yield put({ type: `${key}${NAMESPACE_SEP}@@end` });
        yield delay(ms);
      } catch (error) {
        onError(error, {
          key,
          effectArgs: args,
        });
      }
    }
  }
  return function* racer(...args) {
    yield race({
      task: call(worker, ...args),
      cancel: take(toActionType(R.mergeLeft({ actionStatus: CANCEL_EFFECT }, getActionType(key)))),
    });
  };
}

function getSaga(config) {
  const { ms, type, actionType, sagaWithCatch, sagaWithPolling } = config;
  if (R.equals('watcher', type)) return sagaWithCatch;
  if (R.equals('polling', type))
    return function* () {
      yield takeEvery(actionType, sagaWithPolling);
    };

  if (R.equals('takeLatest', type))
    return function* () {
      yield takeLatest(actionType, sagaWithCatch);
    };
  if (R.equals('throttle', type))
    return function* () {
      yield throttle(ms, actionType, sagaWithCatch);
    };
  return function* effect() {
    yield takeEvery(actionType, sagaWithCatch);
  };
}

function fromModel(modelConfig, onError, onEffect) {
  const effects = R.prop('asyncReducer', modelConfig);
  const namespace = R.prop('namespace', modelConfig);

  return R.map(([key, sagaConfig]) => {
    const { ms, type, saga } = getSagaConfig(sagaConfig);
    return R.compose(
      getSaga,
      from
    )({
      key,
      saga,
      namespace,
      ms,
      type,
      onError,
      sagaEffects: createEffects(modelConfig),
      onEffect,
    });
  }, R.toPairs(effects));
}

export default fromModel;
