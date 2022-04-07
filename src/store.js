import { createStore, applyMiddleware, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { persistStore } from 'redux-persist';
import getSagaAndReducer from './getSagaAndReducer';

const _createStore = ({ storage, models, onError }) => {
  const { reducer, saga } = getSagaAndReducer({ models, storage, onError });
  console.log(reducer, saga);
  const sagaMiddleware = createSagaMiddleware();
  console.log(combineReducers(reducer));
  const store = createStore(combineReducers(reducer), applyMiddleware(sagaMiddleware));
  const persistor = persistStore(store);
  sagaMiddleware.run(saga);
  console.log(persistor);
  return { persistor, store };
};

export default _createStore;
