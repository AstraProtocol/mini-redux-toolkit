import * as R from 'ramda';
import { NAMESPACE_SEP } from './config';
import { persistReducer } from 'redux-persist';

function getActionType(namespace, actionType) {
  return `${namespace}${NAMESPACE_SEP}${actionType}`;
}

function getReducer(namespace, key, handler) {
  const actionType = getActionType(namespace, key);
  return function (state, action) {
    if (R.equals(R.prop('type', action), actionType)) return handler(state);
    return state;
  };
}

function composeReducer(previousReducer, currentReducer) {
  return function (state, action) {
    return previousReducer(currentReducer(state, action), action);
  };
}
const defaultReducer = (state) => Object.assign({}, state);

function getPersistReducer(model, storage) {
  const { persist, namespace } = model;
  const _persistConfig = R.cond([
    [R.isNil, R.identity],
    [R.is(Boolean), R.always({ key: namespace, storage })],
    [R.is(Object), R.mergeLeft({ key: namespace, storage })],
  ])(persist);
  return R.isNil(_persistConfig)
    ? R.identity
    : (rootReducer) => persistReducer(_persistConfig, rootReducer);
}

function fromModel(model, storage) {
  const { reducer: reducers, state, namespace } = model;
  const pairs = R.toPairs(reducers);
  const rootReducer = R.reduce(
    (acc, [actionType, actionHandler]) =>
      composeReducer(acc, getReducer(namespace, actionType, actionHandler)),
    defaultReducer(state),
    pairs
  );
  return getPersistReducer(model, storage)(rootReducer);
}

export default fromModel;
