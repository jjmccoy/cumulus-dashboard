'use strict';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import PropTypes from 'prop-types';
import {
  getCollection,
  listGranules,
  deleteCollection
} from '../../actions';
import { get } from 'object-path';
import {
  tally,
  lastUpdated,
  getCollectionId,
  deleteText
} from '../../utils/format';
import ErrorReport from '../errors/report';
import List from '../table/list-view';
import Overview from '../app/overview';
import AsyncCommand from '../form/async-command';
import { tableHeader, tableRow, tableSortProps } from '../../utils/table-config/granules';
import { updateDelay } from '../../config';
import { strings } from '../locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

class CollectionOverview extends React.Component {
  constructor () {
    super();
    this.displayName = 'CollectionOverview';
    this.load = this.load.bind(this);
    this.generateQuery = this.generateQuery.bind(this);
    this.delete = this.delete.bind(this);
    this.navigateBack = this.navigateBack.bind(this);
    this.errors = this.errors.bind(this);
    this.renderOverview = this.renderOverview.bind(this);
  }

  componentDidMount () {
    this.load();
  }

  componentDidUpdate (prevProps) {
    const { name, version } = this.props.params;
    if (name !== prevProps.params.name ||
       version !== prevProps.params.version) {
      this.load();
    }
  }

  load () {
    const { name, version } = this.props.params;
    this.props.dispatch(getCollection(name, version));
  }

  generateQuery () {
    const collectionId = getCollectionId(this.props.params);
    return {
      collectionId,
      status: 'running'
    };
  }

  delete () {
    const { name, version } = this.props.params;
    this.props.dispatch(deleteCollection(name, version));
  }

  navigateBack () {
    const { router } = this.props;
    router.push('/collections/all');
  }

  errors () {
    const { name, version } = this.props.params;
    const collectionId = getCollectionId({name, version});
    return [
      get(this.props.collections.map, [collectionId, 'error']),
      get(this.props.collections.deleted, [collectionId, 'error'])
    ].filter(Boolean);
  }

  renderOverview (record) {
    const data = get(record, 'data', {});
    const stats = get(data, 'stats', {});
    const overview = [
      [tally(stats.running), strings.granules_running],
      [tally(stats.completed), strings.granules_completed],
      [tally(stats.failed), strings.granules_failed]
    ];
    return <Overview items={overview} inflight={record.inflight} />;
  }

  render () {
    const { params, granules, collections } = this.props;
    const collectionName = params.name;
    const collectionVersion = params.version;
    const collectionId = getCollectionId(params);
    const record = collections.map[collectionId];
    const { list } = granules;
    const { meta } = list;
    const deleteStatus = get(collections.deleted, [collectionId, 'status']);
    const errors = this.errors();

    // create the overview boxes
    const overview = record ? this.renderOverview(record) : <div></div>;
    return (
      <div className='page__component'>
        <section className='page__section page__section__header-wrapper'>
          <h1 className='heading--large heading--shared-content with-description'>{collectionName} / {collectionVersion}</h1>
          <div className='form-group__element--right'>
          <AsyncCommand action={this.delete}
            success={this.navigateBack}
            successTimeout={updateDelay}
            status={deleteStatus}
            confirmAction={true}
            confirmText={deleteText(`${collectionName} ${collectionVersion}`)}
            text={deleteStatus === 'success' ? 'Success!' : 'Delete' } />
          </div>

          <Link className='cdash-btn--edit button--small form-group__element--right' to={`/collections/edit/${collectionName}/${collectionVersion}`}>Edit</Link>
          {lastUpdated(get(record, 'data.timestamp'))}
          {overview}
          {errors.length ? <ErrorReport report={errors} truncate={true} /> : null}
        </section>
        <section className='page__section'>
          <div className='heading__wrapper--border'>
            <h2 className='heading--medium heading--shared-content with-description'>{strings.running_granules}<span className='num--title'>{meta.count ? ` (${meta.count})` : null}</span></h2>
          </div>
          <List
            list={list}
            dispatch={this.props.dispatch}
            action={listGranules}
            tableHeader={tableHeader}
            tableRow={tableRow}
            tableSortProps={tableSortProps}
            query={this.generateQuery()}
            rowId={'granuleId'}
            sortIdx={6}
          />
          <Link className='link--secondary link--learn-more' to={`/collections/collection/${collectionName}/${collectionVersion}/granules`}>{strings.view_all_granules}</Link>
        </section>
      </div>
    );
  }
}

CollectionOverview.propTypes = {
  params: PropTypes.object,
  dispatch: PropTypes.func,
  granules: PropTypes.object,
  collections: PropTypes.object,
  router: PropTypes.object
};

export default connect(state => ({
  collections: state.collections,
  granules: state.granules
}))(CollectionOverview);
