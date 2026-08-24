'use strict';

function isValidPhotoUrl(photo) {
  if (!photo) return true;
  return /^https?:\/\//i.test(photo) || /^\/?uploads\//i.test(photo) || /^\/?images\//i.test(photo);
}

module.exports = { isValidPhotoUrl };
