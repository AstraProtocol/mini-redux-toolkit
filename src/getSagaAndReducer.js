import * as R from 'ramda';
import { put, take, throttle, takeLatest, takeEvery, delay } from 'redux-saga/effects';
import * as sagaEffects from 'redux-saga/effects';
import { persistReducer } from 'redux-persist';

const NAMESPACE_SEP = '/';
function createRootSaga(sagas) {
  return function* rootSaga() {
    for (let i = 0; i < sagas.length; i++) {
      const { saga, namespace } = sagas[i];
      const _saga = Array.isArray(saga) ? saga[1] : saga;
      const cancelKey = Array.isArray(saga) ? saga[0] : '';
      const task = yield sagaEffects.fork(_saga);
      yield sagaEffects.fork(function* () {
        yield sagaEffects.take(
          [`${namespace}/@@CANCEL_EFFECTS`, cancelKey && `${cancelKey}/@@CANCEL_EFFECT`].filter(
            Boolean
          )
        );
        yield sagaEffects.cancel(task);
      });
    }
  };
}

const getActionType = R.curry((namespace, actionType) => {
  return R.join(NAMESPACE_SEP, [namespace, actionType]);
});

const getActionTypeWithCheck = R.curry((namespace, actionType, availableKeys) => {
  const prefix = R.join(NAMESPACE_SEP, [namespace, actionType]);
  const typeWithoutAffix = prefix.replace(/\/@@[^/]+?$/, '');
  if (R.includes(typeWithoutAffix, availableKeys)) return typeWithoutAffix;
  return actionType;
});
const defaultReducer = (state) => Object.assign({}, state);

const applyModel = (storage, model, onError) => {
  const { persist, reducer: reducers, state, namespace, asyncReducer } = model;
  const pairs = R.toPairs(reducers);
  const reducer = R.reduce(
    (acc, [actionType, actionHandler]) => {
      return (_state = state, action) => {
        const handler = R.equals(actionType, action.type) ? actionHandler : R.identity;
        return acc(handler(_state, action), action);
      };
    },
    defaultReducer,
    R.map(([key, handler]) => [getActionType(namespace, key), handler], pairs)
  );
  const asyncReducerPairs = R.compose(
    R.map(([key, handler]) => ({ namespace, key, handler })),
    R.toPairs
  )(asyncReducer);
  const keys = R.map(
    getActionType(namespace),
    R.uniq(R.flatten([R.keys(reducers), R.keys(asyncReducer)]))
  );
  const _persistConfig = R.cond([
    [R.isNil, R.identity],
    [R.is(Boolean), R.always({ key: namespace, storage })],
    [R.is(Object), R.mergeLeft({ key: namespace, storage })],
  ])(persist);
  return {
    namespace,
    reducer: R.isNil(_persistConfig) ? reducer : persistReducer(_persistConfig, reducer),
    sagas: R.map(
      (pair) =>
        isPolling(pair)
          ? createEffectPolling(pair, keys, onError)
          : createEffect(pair, keys, onError),
      asyncReducerPairs
    ),
  };
};

function createEffects(namespace, availableKeys) {
  function put(action) {
    const { type } = action;
    return sagaEffects.put({
      ...action,
      type: getActionTypeWithCheck(namespace, type, availableKeys),
    });
  }
  function putResolve(action) {
    const { type } = action;
    return sagaEffects.put.resolve({
      ...action,
      type: getActionTypeWithCheck(namespace, type, availableKeys),
    });
  }

  put.resolve = putResolve;

  function take(type) {
    if (R.is(Function, type)) return sagaEffects.take(type());
    if (typeof type === 'string') {
      return sagaEffects.take(getActionTypeWithCheck(namespace, type, availableKeys));
    } else if (Array.isArray(type)) {
      return sagaEffects.take(
        type.map((t) => {
          if (typeof t === 'string') {
            return getActionTypeWithCheck(namespace, t, availableKeys);
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
  return function* (...args) {
    yield take(key);
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
  };
}
const isPolling = (config) => R.equals('polling', R.path(['handler', 1, 'type'], config));
function createEffect(config, availableKeys, onError) {
  const { key, namespace, handler } = config;
  const _key = getActionTypeWithCheck(namespace, key, availableKeys);
  const type = R.pathOr('takeLatest', [1, 'type'], handler);
  const ms = R.pathOr(0, [1, 'ms'], handler);
  const _handler = R.head(R.filter(R.is(Function), [handler, R.head(handler)]));
  const _sagaWithCatch = handlerWrapper(
    _key,
    _handler,
    createEffects(namespace, availableKeys, onError),
    onError
  );

  if (R.equals('watcher', type)) return _sagaWithCatch;
  if (R.equals('takeLatest', type))
    return function* () {
      yield takeLatest(_key, _sagaWithCatch);
    };
  if (R.equals('throttle', type))
    return function* () {
      yield throttle(ms, _key, _sagaWithCatch);
    };
  return function* effect() {
    yield takeEvery(_key, _sagaWithCatch);
  };
}

function createEffectPolling(config, availableKeys, onError) {
  const { key, namespace, handler } = config;
  const _key = getActionTypeWithCheck(namespace, key, availableKeys);
  const ms = R.pathOr(0, [1, 'ms'], handler);
  const _handler = R.head(R.filter(R.is(Function), [handler, R.head(handler)]));
  const _sagaWithCatch = handlerWrapperPolling(
    _key,
    _handler,
    ms,
    createEffects(namespace, availableKeys, onError),
    onError
  );
  return [_key, _sagaWithCatch];
}

const applyModels = ({ models, storage, onError }) => {
  const _models = R.map((model) => applyModel(storage, model, onError), models);
  return {
    reducer: R.mergeAll(
      R.map(
        ({ namespace, reducer }) => R.objOf(namespace, reducer),
        R.filter(R.prop('reducer'), R.project(['namespace', 'reducer'], _models))
      )
    ),
    saga: createRootSaga(
      R.flatten(
        R.map(({ namespace, sagas }) => R.map((saga) => ({ namespace, saga }), sagas), _models)
      )
    ),
  };
};

export default applyModels;
