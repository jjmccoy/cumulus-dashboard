'use strict';

import test from 'ava';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import { shallow, configure } from 'enzyme';

import { ReconciliationReport } from '../../../app/scripts/components/reconciliation-reports/reconciliation-report';

configure({ adapter: new Adapter() });

const reconciliationReports = {
  map: {
    exampleReport: {
      data: {
        reportStartTime: '2018-06-11T18:52:37.710Z',
        'reportEndTime': '2018-06-11T18:52:39.893Z',
        status: 'SUCCESS',
        error: null,
        okFileCount: 21,
        onlyInS3: [
          's3://some-bucket/path/to/key-1.hdf',
          's3://some-bucket/path/to/key-2.hdf'
        ],
        onlyInDynamoDb: [
          {
            uri: 's3://some-bucket/path/to/key-123.hdf',
            granuleId: 'g-123'
          },
          {
            uri: 's3://some-bucket/path/to/key-456.hdf',
            granuleId: 'g-456'
          }
        ]
      }
    },
    exampleReportWithError: {
      data: {
        error: 'error creating report'
      }
    }
  }
};

test('show individual report', function (t) {
  const params = { reconciliationReportName: 'exampleReport' };

  const report = shallow(
    <ReconciliationReport
      params={params}
      reconciliationReports={reconciliationReports}
    />
  );

  t.is(report.length, 1);
  const Metadata = report.find('Metadata');
  const MetadataWrapper = Metadata.dive();
  const MetadataWrapperChildren = MetadataWrapper.children();
  // ReconciliationReport is configured to use 6 metaAccessors,
  // so there will be 6 groups of dt, dd elements for a total of 12
  t.is(MetadataWrapperChildren.length, 12);
});

test('report with error triggers error message', function (t) {
  const params = { reconciliationReportName: 'exampleReportWithError' };

  const report = shallow(
    <ReconciliationReport
      params={params}
      reconciliationReports={reconciliationReports}
    />
  );

  t.is(report.length, 1);
  const ErrorReport = report.find('ErrorReport');
  const props = ErrorReport.props();
  t.is(props.report, reconciliationReports.map.exampleReportWithError.data.error);
  t.is(ErrorReport.dive().find('div p').text(), reconciliationReports.map.exampleReportWithError.data.error);
});
