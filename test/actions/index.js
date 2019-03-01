'use strict';
import test from 'ava';
import sinon from 'sinon';

import { CMR } from '../../../cumulus/packages/cmr-client';
import { getMMTLinkFromCmr } from '../../app/scripts/actions/index';

const getStateStub = () => ({
  cumulusInstance: {
    cmrProvider: 'CUMULUS',
    cmrEnvironment: 'SIT'
  },
  mmtLinks: {}
});

const testCollection = {
  name: 'testCollection',
  version: '001'
};

const stubclient = {
  collectionResults: [
    {
      id: 'testC001'
    }
  ]
};

test('should build the correct mmt link', (t) => {
  const expectedLink = 'https://mmt.sit.earthdata.nasa.gov/collections/testC001';
  const stub = sinon.stub(CMR.prototype, 'searchCollections').returns(stubclient.collectionResults);

  let result = 'lattter';
  result = getMMTLinkFromCmr(testCollection, getStateStub);
  stub.restore();
  t.is(result, expectedLink);
});
