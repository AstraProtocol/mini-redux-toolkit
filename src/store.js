import { createStore, applyMiddleware, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { persistStore } from 'redux-persist';
import getSagaAndReducer from './getSagaAndReducer';

const _createStore = ({ storage, models, onError }) => {
  const { reducer, saga, state } = getSagaAndReducer({ models, storage, onError });
  const sagaMiddleware = createSagaMiddleware();
  const store = createStore(combineReducers(reducer), state, applyMiddleware(sagaMiddleware));
  const persistor = persistStore(store);
  sagaMiddleware.run(saga);
  return { persistor, store };
};

export default _createStore;
