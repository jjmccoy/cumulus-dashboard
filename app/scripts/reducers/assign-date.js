'use strict';
export default function assignDate (object) {
  return Object.assign({
    queriedAt: new Date(Date.now())
  }, object);
}
