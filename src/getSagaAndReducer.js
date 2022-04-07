import * as R from 'ramda';
import * as sagaEffects from 'redux-saga/effects';
import createReducerFromModel from './reducer';
import createSagaFromModel from './effect';

function createRootSaga(sagas) {
  return function* rootSaga() {
    for (let i = 0; i < sagas.length; i++) {
      const { saga, namespace } = sagas[i];
      const task = yield sagaEffects.fork(saga);
      yield sagaEffects.fork(function* () {
        yield sagaEffects.take(`${namespace}/@@CANCEL_EFFECTS`);
        yield sagaEffects.cancel(task);
      });
    }
  };
}
function mergeAllSagas(model, onError, onEffect) {
  const sagas = createSagaFromModel(model, onError, onEffect);
  return R.map(R.compose(R.mergeLeft({ namespace: model.namespace }), R.objOf('saga')), sagas);
}

const getSagaAndReducerFromModel = ({ models, storage, onError, onEffect = [] }) => {
  const combinedReducer = R.reduce(
    (rootReducer, model) =>
      R.mergeLeft(rootReducer, R.objOf(model.namespace, createReducerFromModel(model, storage))),
    {},
    models
  );
  console.log('combinedReducer', combinedReducer);
  const saga = createRootSaga(
    R.flatten(R.map((model) => mergeAllSagas(model, onError, onEffect), models))
  );
  console.log('saga', saga);
  return {
    reducer: combinedReducer,
    saga,
  };
};

export default getSagaAndReducerFromModel;
