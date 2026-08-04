'use strict';

let handlerPromise;

module.exports = async (req, res) => {
  if (!handlerPromise) {
    handlerPromise = Promise.resolve().then(() => require('./admin'));
  }
  return handlerPromise(req, res);
};
