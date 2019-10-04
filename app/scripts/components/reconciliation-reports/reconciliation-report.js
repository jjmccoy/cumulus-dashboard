'use strict';
import url from 'url';
import path from 'path';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import {
  interval,
  getReconciliationReport
} from '../../actions';
import { updateInterval } from '../../config';
import {
  tableHeaderS3Files,
  tableRowS3File,
  tablePropsS3File,
  tableHeaderFiles,
  tableRowFile,
  tablePropsFile,
  tableHeaderCollections,
  tableRowCollection,
  tablePropsCollection,
  tableHeaderGranules,
  tableRowGranule,
  tablePropsGranule
} from '../../utils/table-config/reconciliation-reports';

import Metadata from '../table/metadata';
import Loading from '../app/loading-indicator';
import ErrorReport from '../errors/report';

import ReportTable from './report-table';

const reportMetaAccessors = [
  ['Created', 'reportStartTime'],
  ['Status', 'status'],
  ['Files in DynamoDB and S3', 'filesInCumulus.okCount'],
  ['Collections in Cumulus and CMR', 'collectionsInCumulusCmr.okCount'],
  ['Granules in Cumulus and CMR', 'granulesInCumulusCmr.okCount'],
  ['Granule files in Cumulus and CMR', 'filesInCumulusCmr.okCount']
];

const parseFileObject = (d) => {
  const parsed = url.parse(d.uri);
  return {
    granuleId: d.granuleId,
    filename: path.basename(parsed.pathname),
    bucket: parsed.hostname,
    path: parsed.href
  };
};

class ReconciliationReport extends React.Component {
  constructor () {
    super();
    this.reload = this.reload.bind(this);
    this.navigateBack = this.navigateBack.bind(this);
  }

  componentDidMount () {
    const { reconciliationReportName } = this.props.params;
    const immediate = !this.props.reconciliationReports.map[reconciliationReportName];
    this.reload(immediate);
  }

  componentWillUnmount () {
    if (this.cancelInterval) { this.cancelInterval(); }
  }

  reload (immediate) {
    const { reconciliationReportName } = this.props.params;
    const { dispatch } = this.props;
    if (this.cancelInterval) { this.cancelInterval(); }
    this.cancelInterval = interval(() => dispatch(getReconciliationReport(reconciliationReportName)), updateInterval, immediate);
  }

  navigateBack () {
    this.props.router.push('/reconciliations');
  }

  getFilesSummary ({
    onlyInDynamoDb = [],
    onlyInS3 = []
  }) {
    const filesInS3 = onlyInS3.map(d => {
      const parsed = url.parse(d);
      return {
        filename: path.basename(parsed.pathname),
        bucket: parsed.hostname,
        path: parsed.href
      };
    });

    const filesInDynamoDb = onlyInDynamoDb.map(parseFileObject);

    return { filesInS3, filesInDynamoDb };
  }

  getCollectionsSummary ({
    onlyInCumulus = [],
    onlyInCmr = []
  }) {
    const getCollectionName = (collectionName) => ({ name: collectionName });
    const collectionsInCumulus = onlyInCumulus.map(getCollectionName);
    const collectionsInCmr = onlyInCmr.map(getCollectionName);
    return { collectionsInCumulus, collectionsInCmr };
  }

  getGranulesSummary ({
    onlyInCumulus = [],
    onlyInCmr = []
  }) {
    const granulesInCumulus = onlyInCumulus;
    const granulesInCmr = onlyInCmr.map((granule) => ({ granuleId: granule.GranuleUR }));
    return { granulesInCumulus, granulesInCmr };
  }

  getGranuleFilesSummary ({
    onlyInCumulus = [],
    onlyInCmr = []
  }) {
    const granuleFilesOnlyInCumulus = onlyInCumulus.map(parseFileObject);

    const granuleFilesOnlyInCmr = onlyInCmr.map(d => {
      const parsed = url.parse(d.URL);
      const bucket = parsed.hostname.split('.')[0];
      return {
        granuleId: d.GranuleUR,
        filename: path.basename(parsed.pathname),
        bucket,
        path: `s3://${bucket}${parsed.pathname}`
      };
    });

    return { granuleFilesOnlyInCumulus, granuleFilesOnlyInCmr };
  }

  render () {
    const { reconciliationReports } = this.props;
    const { reconciliationReportName } = this.props.params;

    const record = reconciliationReports.map[reconciliationReportName];

    if (!record || (record.inflight && !record.data)) {
      return <Loading />;
    }

    let filesInS3 = [];
    let filesInDynamoDb = [];

    let granuleFilesOnlyInCumulus = [];
    let granuleFilesOnlyInCmr = [];

    let collectionsInCumulus = [];
    let collectionsInCmr = [];

    let granulesInCumulus = [];
    let granulesInCmr = [];

    let report;

    if (record && record.data) {
      report = record.data;

      const {
        filesInCumulus = {},
        filesInCumulusCmr = {},
        collectionsInCumulusCmr = {},
        granulesInCumulusCmr = {}
      } = report;

      ({
        filesInS3,
        filesInDynamoDb
      } = this.getFilesSummary(filesInCumulus));

      ({
        collectionsInCumulus,
        collectionsInCmr
      } = this.getCollectionsSummary(collectionsInCumulusCmr));

      ({
        granulesInCumulus,
        granulesInCmr
      } = this.getGranulesSummary(granulesInCumulusCmr));

      ({
        granuleFilesOnlyInCumulus,
        granuleFilesOnlyInCmr
      } = this.getGranuleFilesSummary(filesInCumulusCmr));
    }

    let error;
    if (record && record.data) {
      error = record.data.error;
    }

    return (
      <div className='page__component'>
        <section className='page__section page__section__header-wrapper'>
          <div className='page__section__header'>
            <h1 className='heading--large heading--shared-content with-description '>{reconciliationReportName}</h1>
            {error ? <ErrorReport report={error} /> : null}
          </div>
        </section>

        <section className='page__section'>
          <div className='page__section--small'>
            <div className='heading__wrapper--border'>
              <h2 className='heading--medium with-description'>Reconciliation report</h2>
            </div>
            <Metadata data={report} accessors={reportMetaAccessors} />
          </div>

          <ReportTable
            data={filesInDynamoDb}
            title={'Files only in DynamoDB'}
            tableHeader={tableHeaderFiles}
            tableRow={tableRowFile}
            tableProps={tablePropsFile}
          />

          <ReportTable
            data={filesInS3}
            title={'Files only in S3'}
            tableHeader={tableHeaderS3Files}
            tableRow={tableRowS3File}
            tableProps={tablePropsS3File}
          />

          <ReportTable
            data={collectionsInCumulus}
            title={'Collections only in Cumulus'}
            tableHeader={tableHeaderCollections}
            tableRow={tableRowCollection}
            tableProps={tablePropsCollection}
          />

          <ReportTable
            data={collectionsInCmr}
            title={'Collections only in CMR'}
            tableHeader={tableHeaderCollections}
            tableRow={tableRowCollection}
            tableProps={tablePropsCollection}
          />

          <ReportTable
            data={granulesInCumulus}
            title={'Granules only in Cumulus'}
            tableHeader={tableHeaderGranules}
            tableRow={tableRowGranule}
            tableProps={tablePropsGranule}
          />

          <ReportTable
            data={granulesInCmr}
            title={'Granules only in CMR'}
            tableHeader={tableHeaderGranules}
            tableRow={tableRowGranule}
            tableProps={tablePropsGranule}
          />

          <ReportTable
            data={granuleFilesOnlyInCumulus}
            title={'Granule files only in Cumulus'}
            tableHeader={tableHeaderFiles}
            tableRow={tableRowFile}
            tableProps={tablePropsFile}
          />

          <ReportTable
            data={granuleFilesOnlyInCmr}
            title={'Granule files only in CMR'}
            tableHeader={tableHeaderFiles}
            tableRow={tableRowFile}
            tableProps={tablePropsFile}
          />
        </section>
      </div>
    );
  }
}

ReconciliationReport.propTypes = {
  reconciliationReports: PropTypes.object,
  dispatch: PropTypes.func,
  params: PropTypes.object,
  router: PropTypes.object
};

ReconciliationReport.defaultProps = {
  reconciliationReports: []
};

export { ReconciliationReport };
export default connect(state => state)(ReconciliationReport);
