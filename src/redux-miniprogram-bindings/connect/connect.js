import { lifetimes } from '../provider';
import handleMapState from './mapState';
import handleMapDispatch from './mapDispatch';
import diff from '../extend/diff';
import subscription from '../extend/subscription';
import { getKeys } from '../utils';

const INSTANCE_ID = Symbol('INSTANCE_ID');
function connect({ type = 'page', mapState, mapDispatch } = {}) {
  const isPage = type === 'page';
  return function processOption(options) {
    if (Array.isArray(mapState) && mapState.length > 0) {
      const unsubscribeMap = new Map();
      const [onLoadKey, onUnloadKey] = lifetimes[type];
      const oldOnLoad = options[onLoadKey];
      const oldOnUnload = options[onUnloadKey];
      options[onLoadKey] = function (...args) {
        const getData = () => this.data;
        const ownState = handleMapState(mapState);
        const diffData = diff(ownState, getData());
        if (getKeys(diffData).length > 0) {
          this.setData(diffData);
        }
        const id = Symbol('instanceId');
        const unsubscribe = subscription(
          { id, data: getData(), setData: this.setData.bind(this) },
          mapState
        );
        unsubscribeMap.set(id, unsubscribe);
        this[INSTANCE_ID] = id;
        if (oldOnLoad) {
          oldOnLoad.apply(this, args);
        }
      };
      options[onUnloadKey] = function () {
        if (oldOnUnload) {
          oldOnUnload.apply(this);
        }
        const id = this[INSTANCE_ID];
        if (unsubscribeMap.has(id)) {
          const unsubscribe = unsubscribeMap.get(id);
          unsubscribeMap.delete(id);
          unsubscribe();
        }
      };
    }
    if (mapDispatch) {
      const target = isPage ? options : (options.methods = options.methods || {});
      handleMapDispatch(mapDispatch, target);
    }
    return options;
  };
}
const connectComponent = (props) => connect({ ...props, type: 'component' });
export { connect, connectComponent };
export default connect;
