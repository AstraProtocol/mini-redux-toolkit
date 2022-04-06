import { getKeys, getType } from '../utils';

const TYPE_OBJECT = '[object Object]';
const TYPE_ARRAY = '[object Array]';
function diffObject(currData, prevData, result, rootPath) {
  const currDataKeys = getKeys(currData);
  const prevDataKeys = getKeys(prevData);
  const currDataKeysLen = currDataKeys.length;
  const prevDataKeysLen = prevDataKeys.length;
  if (currDataKeysLen < 1 && prevDataKeysLen < 1) return;
  if (currDataKeysLen < 1 || prevDataKeysLen < 1 || currDataKeysLen < prevDataKeysLen) {
    result[rootPath] = currData;
    return;
  }
  for (let i = 0; i < prevDataKeysLen; i++) {
    const key = prevDataKeys[i];
    if (currDataKeys.indexOf(key) < 0) {
      result[rootPath] = currData;
      return;
    }
  }
  for (let i = 0; i < currDataKeysLen; i++) {
    const key = currDataKeys[i];
    const currValue = currData[key];
    const targetPath = `${rootPath}.${key}`;
    if (prevDataKeys.indexOf(key) < 0) {
      result[targetPath] = currValue;
      continue;
    }
    const prevValue = prevData[key];
    if (currValue !== prevValue) {
      const currValueType = getType(currValue);
      const prevValueType = getType(prevValue);
      if (currValueType !== prevValueType) {
        result[targetPath] = currValue;
      } else {
        if (currValueType === TYPE_OBJECT) {
          diffObject(currValue, prevValue, result, targetPath);
        } else if (currValueType === TYPE_ARRAY) {
          diffArray(currValue, prevValue, result, targetPath);
        } else {
          result[targetPath] = currValue;
        }
      }
    }
  }
}
function diffArray(currData, prevData, result, rootPath) {
  const currDataLen = currData.length;
  const prevDataLen = prevData.length;
  if (currDataLen < 1 && prevDataLen < 1) return;
  if (currDataLen < 1 || prevDataLen < 1 || currDataLen < prevDataLen) {
    result[rootPath] = currData;
    return;
  }
  for (let i = 0; i < currDataLen; i++) {
    const currValue = currData[i];
    const targetPath = `${rootPath}[${i}]`;
    if (i >= prevDataLen) {
      result[targetPath] = currValue;
      continue;
    }
    const prevValue = prevData[i];
    if (currValue !== prevValue) {
      const currValueType = getType(currValue);
      const prevValueType = getType(prevValue);
      if (currValueType !== prevValueType) {
        result[targetPath] = currValue;
      } else {
        if (currValueType === TYPE_OBJECT) {
          diffObject(currValue, prevValue, result, targetPath);
        } else if (currValueType === TYPE_ARRAY) {
          diffArray(currValue, prevValue, result, targetPath);
        } else {
          result[targetPath] = currValue;
        }
      }
    }
  }
}
function diff(currData, prevData, rootPath = '') {
  const currDataKeys = getKeys(currData);
  const prevDataKeys = getKeys(prevData);
  const currDataKeysLen = currDataKeys.length;
  const prevDataKeysLen = prevDataKeys.length;
  if (currDataKeysLen < 1 && prevDataKeysLen < 1) return {};
  if (currDataKeysLen < 1 || prevDataKeysLen < 1) {
    return rootPath ? { [rootPath]: currData } : currData;
  }
  const result = {};
  for (let i = 0; i < currDataKeysLen; i++) {
    const key = currDataKeys[i];
    const currValue = currData[key];
    const targetPath = rootPath ? `${rootPath}.${key}` : key;
    if (prevDataKeys.indexOf(key) < 0) {
      result[targetPath] = currValue;
      continue;
    }
    const prevValue = prevData[key];
    if (currValue !== prevValue) {
      // console.log(getType, currValue);
      const currValueType = getType(currValue);
      const prevValueType = getType(prevValue);
      if (currValueType !== prevValueType) {
        result[targetPath] = currValue;
      } else {
        if (currValueType === TYPE_OBJECT) {
          diffObject(currValue, prevValue, result, targetPath);
        } else if (currValueType === TYPE_ARRAY) {
          diffArray(currValue, prevValue, result, targetPath);
        } else {
          result[targetPath] = currValue;
        }
      }
    }
  }
  return result;
}

export default diff;
