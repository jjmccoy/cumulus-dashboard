'use strict';
import test from 'ava';

import _config from '../../app/scripts/config';
import {
  addRequestAuthorization,
  formatError,
  getError,
  configureRequest
} from '../../app/scripts/actions/helpers';

const getStateStub = () => ({
  api: {
    tokens: {
      token: 'fake-token'
    }
  }
});

test.beforeEach((t) => {
  t.context.defaultConfig = {
    json: true,
    resolveWithFullResponse: true,
    simple: false
  };

  t.context.defaultHeaders = {
    'Content-Type': 'application/json'
  };

  _config.apiRoot = 'http://localhost';
});

test('formatError() should handle error responses properly', (t) => {
  const requestErrorMessage = 'Request failed';
  const response = {
    statusMessage: requestErrorMessage
  };

  let formattedError = formatError();
  t.is(formattedError, '');

  formattedError = formatError(null);
  t.is(formattedError, '');

  formattedError = formatError(response);
  t.is(formattedError, requestErrorMessage);

  const bodyErrorName = 'InternalServerError';
  const bodyErrorMessage = 'Internal server error';

  formattedError = formatError(null, {
    name: bodyErrorName
  });
  t.is(formattedError, bodyErrorName);

  formattedError = formatError(null, {
    message: bodyErrorMessage
  });
  t.is(formattedError, bodyErrorMessage);

  formattedError = formatError(response, {
    name: bodyErrorName
  });
  t.is(formattedError, bodyErrorName);

  formattedError = formatError(response, {
    message: bodyErrorMessage
  });
  t.is(formattedError, `${requestErrorMessage}: ${bodyErrorMessage}`);

  formattedError = formatError(response, {
    name: bodyErrorName,
    message: bodyErrorMessage
  });
  t.is(formattedError, `${bodyErrorName}: ${bodyErrorMessage}`);
});

test('addRequestAuthorization() should return correct headers', (t) => {
  const config = {};
  addRequestAuthorization(config, getStateStub());
  t.deepEqual(config.headers, {
    Authorization: 'Bearer fake-token'
  });
});

test('configureRequest() should throw error if no URL or path is provided', (t) => {
  const requestParams = {};

  t.throws(() => configureRequest(requestParams), 'Must include a URL or path with request');
});

test('configureRequest() should throw error if path is not a string', (t) => {
  const requestParams = { path: {} };

  t.throws(() => configureRequest(requestParams), 'Path must be a string');
});

test('configureRequest() should add default parameters', (t) => {
  const requestParams = {
    url: 'http://localhost/test'
  };
  const expectedConfig = {
    ...t.context.defaultConfig,
    url: 'http://localhost/test',
    headers: t.context.defaultHeaders
  };
  const requestConfig = configureRequest(requestParams);
  t.deepEqual(requestConfig, expectedConfig);
});

test('configureRequest() should convert path to URL', (t) => {
  const requestParams = {
    path: 'test'
  };
  const expectedConfig = {
    ...t.context.defaultConfig,
    path: 'test',
    url: 'http://localhost/test',
    headers: t.context.defaultHeaders
  };
  const requestConfig = configureRequest(requestParams);
  t.deepEqual(requestConfig, expectedConfig);
});

test('configureRequest() should maintain the request body', (t) => {
  const requestBody = {
    test: 'test'
  };
  const requestParams = {
    url: 'http://localhost/test',
    body: requestBody
  };
  const expectedConfig = {
    ...t.context.defaultConfig,
    url: 'http://localhost/test',
    body: requestBody,
    headers: t.context.defaultHeaders
  };
  const requestConfig = configureRequest(requestParams);
  t.deepEqual(requestConfig, expectedConfig);
});

test('configureRequest() should maintain query state parameters', (t) => {
  const queryParameters = {
    test: 'test'
  };
  const requestParams = {
    url: 'http://localhost/test',
    qs: queryParameters
  };
  const expectedConfig = {
    ...t.context.defaultConfig,
    url: 'http://localhost/test',
    qs: queryParameters,
    headers: t.context.defaultHeaders
  };
  const requestConfig = configureRequest(requestParams);
  t.deepEqual(requestConfig, expectedConfig);
});

test('configureRequest() should not overwrite auth headers', (t) => {
  let requestParams = {
    path: 'test',
    headers: {
      Authorization: 'Bearer fake-token'
    }
  };

  const expectedConfig = {
    ...t.context.defaultConfig,
    path: 'test',
    url: 'http://localhost/test',
    headers: {
      ...t.context.defaultHeaders,
      Authorization: 'Bearer fake-token'
    }
  };

  const requestConfig = configureRequest(requestParams);

  t.deepEqual(requestConfig, expectedConfig);
});

test('getError() returns correct errors', (t) => {
  let error = getError({
    request: { method: 'PUT' },
    body: { detail: 'Detail error' }
  });
  t.is(error, 'Detail error');

  error = getError({
    request: { method: 'PUT' },
    body: { errorMessage: 'PUT error' }
  });
  t.is(error, 'PUT error');

  error = getError({
    request: { method: 'DELETE' },
    body: { errorMessage: 'DELETE error' }
  });
  t.is(error, 'DELETE error');

  error = getError({
    request: { method: 'POST' },
    body: { errorMessage: 'POST error' }
  });
  t.is(error, 'POST error');

  error = getError({
    request: { method: 'GET' },
    body: { message: 'Test error' }
  });
  t.deepEqual(error, new Error('Test error'));
});
