'use strict';
import url from 'url';
import request from 'request';
import _config from '../config';
import log from '../utils/log';
import { get as getToken } from '../utils/auth';
const root = _config.apiRoot;

function setToken (config) {
  let token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = 'Basic ' + token;
  }
  return config;
}

function formatError (response, body) {
  let error = response.statusMessage;
  body = body || {};
  if (body.name) error = body.name;
  if (body.message) error += `: ${body.message}`;
  return error;
}

export const get = function (config, callback) {
  request.get(setToken(config), (error, resp, body) => {
    if (error) {
      return callback(error);
    } else if (+resp.statusCode >= 400) {
      return callback(new Error(formatError(resp, body)));
    }
    return callback(null, body);
  });
};

export const post = function (config, callback) {
  request.post(setToken(config), (error, resp, body) => {
    error = error || body.errorMessage;
    if (error) {
      return callback(error);
    } else if (+resp.statusCode >= 400) {
      return callback(new Error(formatError(resp, body)));
    } else {
      return callback(null, body);
    }
  });
};

export const put = function (config, callback) {
  request.put(setToken(config), (error, resp, body) => {
    error = error || body.errorMessage || body.detail;
    if (error) {
      return callback(error);
    } else if (+resp.statusCode >= 400) {
      return callback(new Error(formatError(resp, body)));
    } else {
      return callback(null, body);
    }
  });
};

export const del = function (config, callback) {
  request.del(setToken(config), (error, resp, body) => {
    error = error || body.errorMessage;
    if (error) {
      return callback(error);
    } else if (+resp.statusCode >= 400) {
      return callback(new Error(formatError(resp, body)));
    } else {
      return callback(null, body);
    }
  });
};

export const wrapRequest = function (id, query, params, type, body) {
  let config;
  if (typeof params === 'string') {
    config = {
      url: url.resolve(root, params)
    };
  } else if (params.url) {
    config = params;
  } else {
    throw new Error('Must include a url with request');
  }
  config.json = true;

  if (body && typeof body === 'object') {
    config.body = body;
  }

  config.headers = config.headers || {};
  config.headers['Content-Type'] = 'application/json';

  return function (dispatch) {
    const inflightType = type + '_INFLIGHT';
    log((id ? inflightType + ': ' + id : inflightType));
    dispatch({ id, config, type: inflightType });

    const start = new Date();
    query(config, (error, data) => {
      if (error || (data && data.msg)) {
        const errorType = type + '_ERROR';
        error = error || data.msg;
        log((id ? errorType + ': ' + id : errorType));
        log(error);

        return dispatch({
          id,
          config,
          type: errorType,
          error
        });
      } else {
        const duration = new Date() - start;
        log((id ? type + ': ' + id : type), duration + 'ms');
        return dispatch({ id, type, data, config });
      }
    });
  };
};
