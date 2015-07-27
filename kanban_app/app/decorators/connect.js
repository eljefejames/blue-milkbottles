import React from 'react';

const connect = (Component, store) => {
  ...
}

  export default (store) => {
    return (target) => connect(target, store);
  };
