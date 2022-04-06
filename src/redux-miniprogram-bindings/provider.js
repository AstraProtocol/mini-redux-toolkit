import { isFunction, isPlainObject, warn } from './utils';
import * as R from 'ramda';

const bindingProvider = Symbol('__REDUX_BINDINGS_PROVIDER__');

const lifetimes = {
  page: ['onLoad', 'onUnload'],
  component: ['onInit', 'didUnmount'],
};

const CHANNEL = 'store';
let _provider;

function setProvider(provider) {
  if (!isPlainObject(provider)) {
    warn('Provider must be plain object!');
  }
  const { store, namespace = '' } = provider;
  if (
    !store ||
    !isFunction(store.getState) ||
    !isFunction(store.dispatch) ||
    !isFunction(store.subscribe)
  ) {
    warn('Store should be instance of redux store!');
  }
  this[bindingProvider] = {
    store,
    lifetimes,
    namespace,
  };
  this.getStore = function () {
    return store;
  };

  this.connector = connector.bind(this);
  store.subscribe(() => {
    const state = store.getState();
    this.emit(CHANNEL, state);
  });
}

function getProvider() {
  if (!_provider) {
    warn('请先设置provider');
  }
  return _provider;
}

function storeProvider(provider) {
  _provider = provider;
  return {
    onLaunch() {
      try {
        if (R.is(Function, this.emit)) this.emit = R.identity;
        if (R.is(Function, this.onMessage)) this.onMessage = R.identity;
        setProvider.bind(this)(provider);
      } catch (error) {
        console.log(error);
      }
    },
  };
}

const memoFn = (selector, fn) => {
  fn.value = null;
  fn.excutedFirst = false;
  return (state) => {
    const newValue = selector(state);
    if (!fn.excutedFirst || fn.value !== newValue) {
      fn.value = newValue;
      fn.excutedFirst = true;
      fn(fn.value);
      return;
    }
  };
};

function connector(state2Props, callback) {
  const NEXT = Symbol('RELAY');
  const onValue = (...value) => this.emit(NEXT, ...value);
  const relayUnsubcribe = this.onMessage(NEXT, callback);
  const newCb = memoFn(state2Props, onValue);
  newCb(getProvider().store.getState());
  const unsubscribe = this.onMessage(CHANNEL, newCb);
  return () => {
    unsubscribe();
    relayUnsubcribe();
  };
}

export { lifetimes, storeProvider, getProvider, setProvider };
