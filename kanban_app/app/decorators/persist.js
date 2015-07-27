import React from 'react';

const persist = (Component, storage, storageName, getData) => {
  ...
}

export default (storage, storageName, getData) => {
  return (target) => persist(target, storage, storageName, getData);
};
