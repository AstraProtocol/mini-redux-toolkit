export const isFunction = (value) => typeof value === 'function';
export const _toString = Object.prototype.toString;
export const isPlainObject = (value) => _toString.call(value) === '[object Object]';
export const getKeys = Object.keys;
export const getType = (value) => _toString.call(value);
export const hasOwnProperty = Object.prototype.hasOwnProperty;
export const warn = (message) => {
  throw new Error(message);
};

const guidManager = (() => {
  const self = {
    ids: new Set(),
  };
  function _guid() {
    let d = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
  const genId = () => {
    const newId = _guid();
    if (!self.ids.has(newId)) {
      self.ids.add(newId);
      return newId;
    }
    return genId();
  };
  return {
    genId,
  };
})();

export const guid = guidManager.genId;
