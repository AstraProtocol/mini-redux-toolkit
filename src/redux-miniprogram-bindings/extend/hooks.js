import { getProvider } from '../provider';

const useStore = () => getProvider().store;
const useState = () => getProvider().store.getState();
const useDispatch = () => getProvider().store.dispatch;
function useSubscribe(handler) {
  const { store } = getProvider();
  let prevState = store.getState();
  return store.subscribe(() => {
    const currState = store.getState();
    handler(currState, prevState);
    prevState = currState;
  });
}
function useRef(selector) {
  const { store } = getProvider();
  const ref = {};
  Object.defineProperty(ref, 'value', {
    configurable: false,
    enumerable: true,
    get() {
      return selector(store.getState());
    },
  });
  return ref;
}
function useSelector(selector, deps) {
  if (!Array.isArray(deps) || deps.length < 1) {
    return selector;
  }
  let lastState = {};
  let lastResult;
  return function (state) {
    if (deps.some((k) => lastState[k] !== state[k])) {
      lastState = state;
      lastResult = selector(state);
    }
    return lastResult;
  };
}

export { useDispatch, useRef, useSelector, useState, useStore, useSubscribe };
