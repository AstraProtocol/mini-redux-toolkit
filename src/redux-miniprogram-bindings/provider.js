import { isFunction, isPlainObject, warn, guid } from './utils';
import * as R from 'ramda';

const lifetimes = {
  page: ['onLoad', 'onUnload'],
  component: ['onInit', 'didUnmount'],
};

const CHANNEL = 'store';
let _provider;

function getProvider() {
  if (!_provider) {
    warn('Provider is not existed!');
  }
  return _provider;
}

function storeProvider(provider) {
  _provider = provider;

  return {
    __REDUX_BINDINGS_PROVIDER__: {
      store: provider.store,
      lifetimes,
      namespace: provider.namespace,
    },
    onLaunch() {
      if (!isPlainObject(provider)) {
        warn('Provider must be plain object!');
      }
      const { store } = provider;
      if (
        !store ||
        !isFunction(store.getState) ||
        !isFunction(store.dispatch) ||
        !isFunction(store.subscribe)
      ) {
        warn('Store should be instance of redux store!');
      }

      store.subscribe(() => {
        const state = store.getState();
        this.emit(CHANNEL, state);
      });
    },
    connector(state2Props, callback) {
      const NEXT = guid();
      const emitter = this.emit.bind(this);
      const onMessage = this.onMessage.bind(this);
      const onValue = (...value) => emitter(NEXT, ...value);
      const relayUnsubcribe = onMessage(NEXT, callback);
      const newCb = memoFn(state2Props, onValue);
      newCb(getProvider().store.getState());
      const unsubscribe = onMessage(CHANNEL, newCb);
      return () => {
        unsubscribe();
        relayUnsubcribe();
      };
    },
    getStore() {
      return R.prop('store', provider);
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

export { lifetimes, storeProvider, getProvider };
