import { useDispatch } from '../extend/hooks';
import { isPlainObject, isFunction, getKeys, warn } from '../utils';

function handleMapDispatchObject(mapDispatch, target) {
  const dispatch = useDispatch();
  const keys = getKeys(mapDispatch);
  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i];
    const actionCreator = mapDispatch[key];
    if (isFunction(actionCreator)) {
      target[key] = (...args) => dispatch(actionCreator.apply(null, args));
    }
  }
}
function handleMapDispatchFunction(mapDispatch, target) {
  const dispatch = useDispatch();
  const boundActionCreators = mapDispatch(dispatch);
  if (!isPlainObject(boundActionCreators)) {
    warn('mapDispatch should be Map<string, function>');
  }
  Object.assign(target, boundActionCreators);
}
export default function handleMapDispatch(mapDispatch, target) {
  if (isPlainObject(mapDispatch)) {
    handleMapDispatchObject(mapDispatch, target);
  } else if (isFunction(mapDispatch)) {
    handleMapDispatchFunction(mapDispatch, target);
  }
}
