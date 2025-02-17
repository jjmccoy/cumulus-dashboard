'use strict';

import compareVersions from 'compare-versions';
import moment from 'moment';
import url from 'url';
import { get as getProperty } from 'object-path';
import requestPromise from 'request-promise';
import { hashHistory } from 'react-router';
import { CMR, hostId } from '@cumulus/cmrjs';

import { configureRequest } from './helpers';
import _config from '../config';
import { getCollectionId, collectionNameVersion } from '../utils/format';
import log from '../utils/log';
import { authHeader } from '../utils/basic-auth';
import { apiGatewaySearchTemplate } from './action-config/apiGatewaySearch';
import { apiLambdaSearchTemplate } from './action-config/apiLambdaSearch';
import { teaLambdaSearchTemplate } from './action-config/teaLambdaSearch';
import { s3AccessSearchTemplate } from './action-config/s3AccessSearch';
import * as types from './types';

const CALL_API = types.CALL_API;
const {
  esRoot,
  showDistributionAPIMetrics,
  showTeaMetrics,
  apiRoot: root,
  pageLimit,
  minCompatibleApiVersion
} = _config;

const millisecondsPerDay = 24 * 60 * 60 * 1000;

export const refreshAccessToken = (token) => {
  return (dispatch) => {
    const start = new Date();
    log('REFRESH_TOKEN_INFLIGHT');
    dispatch({ type: types.REFRESH_TOKEN_INFLIGHT });

    const requestConfig = configureRequest({
      method: 'POST',
      url: url.resolve(root, 'refresh'),
      body: { token },
      // make sure request failures are sent to .catch()
      simple: true
    });
    return requestPromise(requestConfig)
      .then(({ body }) => {
        const duration = new Date() - start;
        log('REFRESH_TOKEN', duration + 'ms');
        return dispatch({
          type: types.REFRESH_TOKEN,
          token: body.token
        });
      })
      .catch(({ error }) => {
        dispatch({
          type: types.REFRESH_TOKEN_ERROR,
          error
        });
        throw error;
      });
  };
};

export const setTokenState = (token) => ({ type: types.SET_TOKEN, token });

export const interval = function (action, wait, immediate) {
  if (immediate) { action(); }
  const intervalId = setInterval(action, wait);
  return () => clearInterval(intervalId);
};

export const getCollection = (name, version) => ({
  [CALL_API]: {
    type: types.COLLECTION,
    method: 'GET',
    id: getCollectionId({name, version}),
    path: `collections?name=${name}&version=${version}`
  }
});

export const getApiVersion = () => {
  return (dispatch) => {
    const config = configureRequest({
      method: 'GET',
      url: url.resolve(root, 'version'),
      // make sure request failures are sent to .catch()
      simple: true
    });
    return requestPromise(config)
      .then(({ body }) => dispatch({
        type: types.API_VERSION,
        payload: { versionNumber: body.api_version }
      }))
      .then(() => dispatch(checkApiVersion()))
      .catch(({ error }) => dispatch({
        type: types.API_VERSION_ERROR,
        payload: { error }
      }));
  };
};

export const checkApiVersion = () => {
  return (dispatch, getState) => {
    const { versionNumber } = getState().apiVersion;
    if (compareVersions(versionNumber, minCompatibleApiVersion) >= 0) {
      dispatch({
        type: types.API_VERSION_COMPATIBLE
      });
    } else {
      dispatch({
        type: types.API_VERSION_INCOMPATIBLE,
        payload: {
          warning: `Dashboard version incompatible with Cumulus API version (${versionNumber})`
        }
      });
    }
  };
};

export const listCollections = (options) => {
  return (dispatch) => {
    return dispatch({
      [CALL_API]: {
        type: types.COLLECTIONS,
        method: 'GET',
        id: null,
        url: url.resolve(root, 'collections'),
        qs: Object.assign({ limit: pageLimit }, options)
      }
    }).then(() => {
      return dispatch(getMMTLinks());
    });
  };
};

export const createCollection = (payload) => ({
  [CALL_API]: {
    type: types.NEW_COLLECTION,
    method: 'POST',
    id: getCollectionId(payload),
    path: 'collections',
    body: payload
  }
});

export const updateCollection = (payload) => ({
  [CALL_API]: {
    type: types.UPDATE_COLLECTION,
    method: 'PUT',
    id: getCollectionId(payload),
    path: `collections/${payload.name}/${payload.version}`,
    body: payload
  }
});

export const clearUpdateCollection = (collectionName) => ({ type: types.UPDATE_COLLECTION_CLEAR, id: collectionName });

export const deleteCollection = (name, version) => ({
  [CALL_API]: {
    type: types.COLLECTION_DELETE,
    method: 'DELETE',
    id: getCollectionId({name, version}),
    path: `collections/${name}/${version}`
  }
});

export const searchCollections = (prefix) => ({ type: types.SEARCH_COLLECTIONS, prefix: prefix });
export const clearCollectionsSearch = () => ({ type: types.CLEAR_COLLECTIONS_SEARCH });
export const filterCollections = (param) => ({ type: types.FILTER_COLLECTIONS, param: param });
export const clearCollectionsFilter = (paramKey) => ({ type: types.CLEAR_COLLECTIONS_FILTER, paramKey: paramKey });

export const getCumulusInstanceMetadata = () => ({
  [CALL_API]: {
    type: types.ADD_INSTANCE_META,
    method: 'GET',
    path: 'instanceMeta'
  }
});

/**
 * Iterates over each collection in the application collections state dispatching the
 * action to add the MMT link to the its state.
 * @returns {function} anonymous redux-thunk function.
 */
export const getMMTLinks = () => {
  return (dispatch, getState) => {
    const { data } = getState().collections.list;
    data.forEach((collection) => {
      getMMTLinkFromCmr(collection, getState)
        .then((url) => {
          const action = {
            type: types.ADD_MMTLINK,
            data: { name: collection.name, version: collection.version, url: url }
          };
          dispatch(action);
        })
        .catch((error) => console.error(error));
    });
  };
};

/**
 *
 * @param {Object} collection - application collections item.
 * @param {function} getState - redux function to access app state.
 * @returns {Promise<string>} - Promise for a Metadata Management Toolkit (MMT) Link
 *                              to the input collection or null if it doesn't exist.
 */
export const getMMTLinkFromCmr = (collection, getState) => {
  const {cmrProvider, cmrEnvironment} = getState().cumulusInstance;
  if (!cmrProvider || !cmrEnvironment) return null;

  const mmtLinks = getState().mmtLinks;
  if (getCollectionId(collection) in mmtLinks) {
    return Promise.resolve(mmtLinks[getCollectionId(collection)]);
  }
  const search = new CMR(cmrProvider);
  return search.searchCollections({short_name: collection.name, version: collection.version})
    .then((results) => {
      if (results.length === 1) {
        const conceptId = results[0].id;
        if (conceptId) {
          return buildMMTLink(conceptId, cmrEnvironment);
        }
      }
      return null;
    })
    .catch((error) => {
      console.log(error);
    });
};

/**
 * Build correct link to collection based on conceptId and cumulus environment.
 *
 * @param {string} conceptId - CMR's concept id
 * @param {string} cmrEnv - cumulus instance operating environ UAT/SIT/PROD.
 * @returns {string} MMT link to edit the collection at conceptId.
 */
export const buildMMTLink = (conceptId, cmrEnv) => {
  const url = ['mmt', hostId(cmrEnv), 'earthdata.nasa.gov'].filter((d) => d).join('.');
  return `https://${url}/collections/${conceptId}`;
};

export const getGranule = (granuleId) => ({
  [CALL_API]: {
    type: types.GRANULE,
    method: 'GET',
    id: granuleId,
    path: `granules/${granuleId}`
  }
});

export const listGranules = (options) => ({
  [CALL_API]: {
    type: types.GRANULES,
    method: 'GET',
    id: null,
    url: url.resolve(root, 'granules'),
    qs: Object.assign({ limit: pageLimit }, options)
  }
});

// only query the granules from the last hour
export const getRecentGranules = () => ({
  [CALL_API]: {
    type: types.RECENT_GRANULES,
    method: 'GET',
    path: 'granules',
    qs: {
      limit: 1,
      fields: 'granuleId',
      updatedAt__from: moment().subtract(1, 'hour').format()
    }
  }
});

export const reprocessGranule = (granuleId) => ({
  [CALL_API]: {
    type: types.GRANULE_REPROCESS,
    method: 'PUT',
    id: granuleId,
    path: `granules/${granuleId}`,
    body: {
      action: 'reprocess'
    }
  }
});

export const applyWorkflowToCollection = (name, version, workflow) => ({
  [CALL_API]: {
    type: types.COLLECTION_APPLYWORKFLOW,
    method: 'PUT',
    id: getCollectionId({name, version}),
    path: `collections/${name}/${version}`,
    body: {
      action: 'applyWorkflow',
      workflow
    }
  }
});

export const applyRecoveryWorkflowToCollection = (collectionId) => {
  return (dispatch) => {
    const { name, version } = collectionNameVersion(collectionId);
    return dispatch(getCollection(name, version))
      .then((collectionResponse) => {
        const collectionRecoveryWorkflow = getProperty(
          collectionResponse, 'data.results.0.meta.collectionRecoveryWorkflow'
        );
        if (collectionRecoveryWorkflow) {
          return dispatch(applyWorkflowToCollection(name, version, collectionRecoveryWorkflow));
        } else {
          throw new ReferenceError(
            `Unable to apply recovery workflow to ${collectionId} because the attribute collectionRecoveryWorkflow is not set in collection.meta`
          );
        }
      })
      .catch((error) => dispatch({
        id: collectionId,
        type: types.COLLECTION_APPLYWORKFLOW_ERROR,
        error: error
      }));
  };
};

export const applyWorkflowToGranule = (granuleId, workflow) => ({
  [CALL_API]: {
    type: types.GRANULE_APPLYWORKFLOW,
    method: 'PUT',
    id: granuleId,
    path: `granules/${granuleId}`,
    body: {
      action: 'applyWorkflow',
      workflow
    }
  }
});

export const getCollectionByGranuleId = (granuleId) => {
  return (dispatch) => {
    return dispatch(getGranule(granuleId)).then((granuleResponse) => {
      const { name, version } = collectionNameVersion(granuleResponse.data.collectionId);
      return dispatch(getCollection(name, version));
    });
  };
};

export const applyRecoveryWorkflowToGranule = (granuleId) => {
  return (dispatch) => {
    return dispatch(getCollectionByGranuleId(granuleId))
      .then((collectionResponse) => {
        const granuleRecoveryWorkflow = getProperty(
          collectionResponse, 'data.results.0.meta.granuleRecoveryWorkflow'
        );
        if (granuleRecoveryWorkflow) {
          return dispatch(applyWorkflowToGranule(granuleId, granuleRecoveryWorkflow));
        } else {
          throw new ReferenceError(
            `Unable to apply recovery workflow to ${granuleId} because the attribute granuleRecoveryWorkflow is not set in collection.meta`
          );
        }
      })
      .catch((error) => dispatch({
        id: granuleId,
        type: types.GRANULE_APPLYWORKFLOW_ERROR,
        error: error
      }));
  };
};

export const reingestGranule = (granuleId) => ({
  [CALL_API]: {
    type: types.GRANULE_REINGEST,
    method: 'PUT',
    id: granuleId,
    path: `granules/${granuleId}`,
    body: {
      action: 'reingest'
    }
  }
});

export const removeGranule = (granuleId) => ({
  [CALL_API]: {
    type: types.GRANULE_REMOVE,
    method: 'PUT',
    id: granuleId,
    path: `granules/${granuleId}`,
    body: {
      action: 'removeFromCmr'
    }
  }
});

export const deleteGranule = (granuleId) => ({
  [CALL_API]: {
    type: types.GRANULE_DELETE,
    method: 'DELETE',
    id: granuleId,
    path: `granules/${granuleId}`
  }
});

export const searchGranules = (prefix) => ({ type: types.SEARCH_GRANULES, prefix: prefix });
export const clearGranulesSearch = () => ({ type: types.CLEAR_GRANULES_SEARCH });
export const filterGranules = (param) => ({ type: types.FILTER_GRANULES, param: param });
export const clearGranulesFilter = (paramKey) => ({ type: types.CLEAR_GRANULES_FILTER, paramKey: paramKey });

export const getGranuleCSV = (options) => ({
  [CALL_API]: {
    type: types.GRANULE_CSV,
    method: 'GET',
    url: url.resolve(root, 'granule-csv')
  }
});

export const getOptionsCollectionName = (options) => ({
  [CALL_API]: {
    type: types.OPTIONS_COLLECTIONNAME,
    method: 'GET',
    url: url.resolve(root, 'collections'),
    qs: { limit: 100, fields: 'name,version' }
  }
});

export const getStats = (options) => ({
  [CALL_API]: {
    type: types.STATS,
    method: 'GET',
    url: url.resolve(root, 'stats'),
    qs: options
  }
});

export const getDistApiGatewayMetrics = (cumulusInstanceMeta) => {
  const stackName = cumulusInstanceMeta.stackName;
  const now = Date.now();
  const twentyFourHoursAgo = now - millisecondsPerDay;
  if (!esRoot) return { type: types.NOOP };
  return {
    [CALL_API]: {
      type: types.DIST_APIGATEWAY,
      skipAuth: true,
      method: 'POST',
      url: `${esRoot}/_search/`,
      headers: authHeader(),
      body: JSON.parse(apiGatewaySearchTemplate(stackName, twentyFourHoursAgo, now))
    }
  };
};

export const getDistApiLambdaMetrics = (cumulusInstanceMeta) => {
  const stackName = cumulusInstanceMeta.stackName;
  const now = Date.now();
  const twentyFourHoursAgo = now - millisecondsPerDay;
  if (!esRoot) return { type: types.NOOP };
  if (!showDistributionAPIMetrics) return {type: types.NOOP};
  return {
    [CALL_API]: {
      type: types.DIST_API_LAMBDA,
      skipAuth: true,
      method: 'POST',
      url: `${esRoot}/_search/`,
      headers: authHeader(),
      body: JSON.parse(apiLambdaSearchTemplate(stackName, twentyFourHoursAgo, now))
    }
  };
};

export const getTEALambdaMetrics = (cumulusInstanceMeta) => {
  const stackName = cumulusInstanceMeta.stackName;
  const now = Date.now();
  const twentyFourHoursAgo = now - millisecondsPerDay;
  if (!esRoot) return { type: types.NOOP };
  if (!showTeaMetrics) return { type: types.NOOP };
  return {
    [CALL_API]: {
      type: types.DIST_TEA_LAMBDA,
      skipAuth: true,
      method: 'POST',
      url: `${esRoot}/_search/`,
      headers: authHeader(),
      body: JSON.parse(teaLambdaSearchTemplate(stackName, twentyFourHoursAgo, now))
    }
  };
};

export const getDistS3AccessMetrics = (cumulusInstanceMeta) => {
  const stackName = cumulusInstanceMeta.stackName;
  const now = Date.now();
  const twentyFourHoursAgo = now - millisecondsPerDay;
  if (!esRoot) return { type: types.NOOP };
  return {
    [CALL_API]: {
      type: types.DIST_S3ACCESS,
      skipAuth: true,
      method: 'POST',
      url: `${esRoot}/_search/`,
      headers: authHeader(),
      body: JSON.parse(s3AccessSearchTemplate(stackName, twentyFourHoursAgo, now))
    }
  };
};

// count queries *must* include type and field properties.
export const getCount = (options) => ({
  [CALL_API]: {
    type: types.COUNT,
    method: 'GET',
    id: null,
    url: url.resolve(root, 'stats/aggregate'),
    qs: Object.assign({ type: 'must-include-type', field: 'status' }, options)
  }
});

export const listPdrs = (options) => ({
  [CALL_API]: {
    type: types.PDRS,
    method: 'GET',
    url: url.resolve(root, 'pdrs'),
    qs: Object.assign({ limit: pageLimit }, options)
  }
});

export const getPdr = (pdrName) => ({
  [CALL_API]: {
    id: pdrName,
    type: types.PDR,
    method: 'GET',
    path: `pdrs/${pdrName}`
  }
});

export const searchPdrs = (prefix) => ({ type: types.SEARCH_PDRS, prefix: prefix });
export const clearPdrsSearch = () => ({ type: types.CLEAR_PDRS_SEARCH });
export const filterPdrs = (param) => ({ type: types.FILTER_PDRS, param: param });
export const clearPdrsFilter = (paramKey) => ({ type: types.CLEAR_PDRS_FILTER, paramKey: paramKey });

export const listProviders = (options) => ({
  [CALL_API]: {
    type: types.PROVIDERS,
    method: 'GET',
    url: url.resolve(root, 'providers'),
    qs: Object.assign({ limit: pageLimit }, options)
  }
});

export const getOptionsProviderGroup = () => ({
  [CALL_API]: {
    type: types.OPTIONS_PROVIDERGROUP,
    method: 'GET',
    url: url.resolve(root, 'providers'),
    qs: { limit: 100, fields: 'providerName' }
  }
});

export const getProvider = (providerId) => ({
  [CALL_API]: {
    type: types.PROVIDER,
    id: providerId,
    method: 'GET',
    path: `providers/${providerId}`
  }
});

export const createProvider = (providerId, payload) => ({
  [CALL_API]: {
    type: types.NEW_PROVIDER,
    id: providerId,
    method: 'POST',
    path: 'providers',
    body: payload
  }
});

export const updateProvider = (providerId, payload) => ({
  [CALL_API]: {
    type: types.UPDATE_PROVIDER,
    id: providerId,
    method: 'PUT',
    path: `providers/${providerId}`,
    body: payload
  }
});

export const clearUpdateProvider = (providerId) => ({ type: types.UPDATE_PROVIDER_CLEAR, id: providerId });

export const deleteProvider = (providerId) => ({
  [CALL_API]: {
    type: types.PROVIDER_DELETE,
    id: providerId,
    method: 'DELETE',
    path: `providers/${providerId}`
  }
});

export const searchProviders = (prefix) => ({ type: types.SEARCH_PROVIDERS, prefix: prefix });
export const clearProvidersSearch = () => ({ type: types.CLEAR_PROVIDERS_SEARCH });
export const filterProviders = (param) => ({ type: types.FILTER_PROVIDERS, param: param });
export const clearProvidersFilter = (paramKey) => ({ type: types.CLEAR_PROVIDERS_FILTER, paramKey: paramKey });

export const deletePdr = (pdrName) => ({
  [CALL_API]: {
    type: types.PDR_DELETE,
    id: pdrName,
    method: 'DELETE',
    path: `pdrs/${pdrName}`
  }
});

export const getLogs = (options) => ({
  [CALL_API]: {
    type: types.LOGS,
    method: 'GET',
    url: url.resolve(root, 'logs'),
    qs: Object.assign({limit: 100}, options)
  }
});

export const clearLogs = () => ({ type: types.CLEAR_LOGS });

export const logout = () => {
  return (dispatch) => {
    return dispatch(deleteToken())
      .then(() => dispatch({ type: types.LOGOUT }));
  };
};

export const login = (token) => ({
  [CALL_API]: {
    type: types.LOGIN,
    id: 'auth',
    method: 'GET',
    url: url.resolve(root, 'granules'),
    qs: { limit: 1, fields: 'granuleId' },
    skipAuth: true,
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
});

export const deleteToken = () => {
  return (dispatch, getState) => {
    const token = getProperty(getState(), 'api.tokens.token');
    if (!token) return Promise.resolve();

    const requestConfig = configureRequest({
      method: 'DELETE',
      url: url.resolve(root, `tokenDelete/${token}`)
    });
    return requestPromise(requestConfig)
      .finally(() => dispatch({ type: types.DELETE_TOKEN }));
  };
};

export const loginError = (error) => {
  return (dispatch) => {
    return dispatch(deleteToken())
      .then(() => dispatch({ type: 'LOGIN_ERROR', error }))
      .then(() => hashHistory.push('/auth'));
  };
};

export const getSchema = (type) => ({
  [CALL_API]: {
    type: types.SCHEMA,
    method: 'GET',
    path: `schemas/${type}`
  }
});

export const queryHistogram = (options) => ({
  [CALL_API]: {
    type: types.HISTOGRAM,
    method: 'GET',
    url: url.resolve(root, 'stats/histogram'),
    qs: options
  }
});

export const listWorkflows = () => ({
  [CALL_API]: {
    type: types.WORKFLOWS,
    method: 'GET',
    url: url.resolve(root, 'workflows')
  }
});

export const getExecutionStatus = (arn) => ({
  [CALL_API]: {
    type: types.EXECUTION_STATUS,
    method: 'GET',
    url: url.resolve(root, 'executions/status/' + arn)
  }
});

export const getExecutionLogs = (executionName) => ({
  [CALL_API]: {
    type: types.EXECUTION_LOGS,
    method: 'GET',
    url: url.resolve(root, 'logs/' + executionName)
  }
});

export const listExecutions = (options) => ({
  [CALL_API]: {
    type: types.EXECUTIONS,
    method: 'GET',
    url: url.resolve(root, 'executions'),
    qs: Object.assign({ limit: pageLimit }, options)
  }
});

export const filterExecutions = (param) => ({ type: types.FILTER_EXECUTIONS, param: param });
export const clearExecutionsFilter = (paramKey) => ({ type: types.CLEAR_EXECUTIONS_FILTER, paramKey: paramKey });

export const listRules = (options) => ({
  [CALL_API]: {
    type: types.RULES,
    method: 'GET',
    url: url.resolve(root, 'rules'),
    qs: Object.assign({ limit: pageLimit }, options)
  }
});

export const getRule = (ruleName) => ({
  [CALL_API]: {
    id: ruleName,
    type: types.RULE,
    method: 'GET',
    path: `rules?name=${ruleName}`
  }
});

export const updateRule = (payload) => ({
  [CALL_API]: {
    id: payload.name,
    type: types.UPDATE_RULE,
    method: 'PUT',
    path: `rules/${payload.name}`,
    body: payload
  }
});

export const clearUpdateRule = (ruleName) => ({ type: types.UPDATE_RULE_CLEAR, id: ruleName });

export const createRule = (payload) => ({
  [CALL_API]: {
    id: payload.name,
    type: types.NEW_RULE,
    method: 'POST',
    path: 'rules',
    body: payload
  }
});

export const deleteRule = (ruleName) => ({
  [CALL_API]: {
    id: ruleName,
    type: types.RULE_DELETE,
    method: 'DELETE',
    path: `rules/${ruleName}`
  }
});

export const enableRule = (ruleName) => ({
  [CALL_API]: {
    id: ruleName,
    type: types.RULE_ENABLE,
    method: 'PUT',
    path: `rules/${ruleName}`,
    body: {
      state: 'ENABLED'
    }
  }
});

export const disableRule = (ruleName) => ({
  [CALL_API]: {
    id: ruleName,
    type: types.RULE_DISABLE,
    method: 'PUT',
    path: `rules/${ruleName}`,
    body: {
      state: 'DISABLED'
    }
  }
});

export const rerunRule = (ruleName) => ({
  [CALL_API]: {
    id: ruleName,
    type: types.RULE_RERUN,
    method: 'PUT',
    path: `rules/${ruleName}`,
    body: {
      action: 'rerun'
    }
  }
});

export const listReconciliationReports = (options) => ({
  [CALL_API]: {
    type: types.RECONCILIATIONS,
    method: 'GET',
    url: url.resolve(root, 'reconciliationReports'),
    qs: Object.assign({ limit: pageLimit }, options)
  }
});

export const getReconciliationReport = (reconciliationName) => ({
  [CALL_API]: {
    id: reconciliationName,
    type: types.RECONCILIATION,
    method: 'GET',
    path: `reconciliationReports/${reconciliationName}`
  }
});

export const createReconciliationReport = () => ({
  [CALL_API]: {
    id: `reconciliation-report-${new Date().toISOString()}`,
    type: types.NEW_RECONCILIATION,
    method: 'POST',
    path: 'reconciliationReports'
  }
});

export const searchReconciliationReports = (prefix) => ({ type: types.SEARCH_RECONCILIATIONS, prefix: prefix });
export const clearReconciliationReportSearch = () => ({ type: types.CLEAR_RECONCILIATIONS_SEARCH });
