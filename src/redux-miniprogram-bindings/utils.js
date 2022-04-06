export const isFunction = (value) => typeof value === 'function';
export const _toString = Object.prototype.toString;
export const isPlainObject = (value) => _toString.call(value) === '[object Object]';
export const getKeys = Object.keys;
export const getType = (value) => _toString.call(value);
export const hasOwnProperty = Object.prototype.hasOwnProperty;
export const warn = (message) => {
  throw new Error(message);
};
