'use strict';
import { set } from 'object-path';
import {
  WORKFLOWS,
  WORKFLOWS_INFLIGHT,
  WORKFLOWS_ERROR
} from '../actions/types';

export const initialState = {
  list: {
    data: [],
    meta: {},
    params: {},
    inflight: false,
    error: false
  },
  map: {}
};

function createMap (data) {
  const map = {};
  data.forEach(d => {
    map[d.name] = d;
  });
  return map;
}

export default function reducer (state = initialState, action) {
  state = Object.assign({}, state);
  const { data } = action;
  switch (action.type) {
    case WORKFLOWS:
      set(state, 'map', createMap(data));
      set(state, ['list', 'data'], data);
      set(state, ['list', 'meta'], { queriedAt: new Date() });
      set(state, ['list', 'inflight'], false);
      set(state, ['list', 'error'], false);
      break;
    case WORKFLOWS_INFLIGHT:
      set(state, ['list', 'inflight'], true);
      break;
    case WORKFLOWS_ERROR:
      set(state, ['list', 'inflight'], false);
      set(state, ['list', 'error'], action.error);
      break;
  }
  return state;
}
