'use strict';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import {
  interval,
  getProvider,
  deleteProvider,
  listCollections
} from '../../actions';
import { get } from 'object-path';
import {
  fromNow,
  lastUpdated,
  deleteText,
  link,
  tally
} from '../../utils/format';
import Loading from '../app/loading-indicator';
import LogViewer from '../logs/viewer';
import AsyncCommands from '../form/dropdown-async-command';
import ErrorReport from '../errors/report';
import Metadata from '../table/metadata';
import { updateInterval } from '../../config';

const metaAccessors = [
  ['Created', 'createdAt', fromNow],
  ['Updated', 'updatedAt', fromNow],
  ['Protocol', 'protocol'],
  ['Host', 'host', link],
  ['Global Connection Limit', 'globalConnectionLimit', tally]
];

class ProviderOverview extends React.Component {
  constructor () {
    super();
    this.displayName = 'Provider';
    this.reload = this.reload.bind(this);
    this.navigateBack = this.navigateBack.bind(this);
    this.delete = this.delete.bind(this);
    this.errors = this.errors.bind(this);
  }

  componentDidMount () {
    const { providerId } = this.props.params;
    const immediate = !this.props.providers.map[providerId];
    this.reload(immediate);
    this.props.dispatch(listCollections({
      limit: 100,
      fields: 'collectionName',
      providers: providerId
    }));
  }

  componentWillUnmount () {
    if (this.cancelInterval) { this.cancelInterval(); }
  }

  reload (immediate, timeout) {
    timeout = timeout || updateInterval;
    const providerId = this.props.params.providerId;
    const { dispatch } = this.props;
    if (this.cancelInterval) { this.cancelInterval(); }
    this.cancelInterval = interval(() => dispatch(getProvider(providerId)), timeout, immediate);
  }

  navigateBack () {
    const { router } = this.props;
    router.push('/providers');
  }

  delete () {
    const { providerId } = this.props.params;
    const provider = this.props.providers.map[providerId].data;
    if (!provider.published) {
      this.props.dispatch(deleteProvider(providerId));
    }
  }

  errors () {
    const providerId = this.props.params.providerId;
    return [
      get(this.props.providers.map, [providerId, 'error']),
      get(this.props.providers.deleted, [providerId, 'error'])
    ].filter(Boolean);
  }

  render () {
    const providerId = this.props.params.providerId;
    const record = this.props.providers.map[providerId];

    if (!record || (record.inflight && !record.data)) {
      return <Loading />;
    } else if (record.error) {
      return <ErrorReport report={record.error} truncate={true} />;
    }
    const provider = record.data;
    const logsQuery = { 'meta.provider': providerId };
    const errors = this.errors();

    const deleteStatus = get(this.props.providers.deleted, [providerId, 'status']);
    const dropdownConfig = [{
      text: 'Delete',
      action: this.delete,
      disabled: provider.published,
      status: deleteStatus,
      success: this.navigateBack,
      confirmAction: true,
      confirmText: deleteText(providerId)
    }];

    return (
      <div className='page__component'>
        <section className='page__section page__section__header-wrapper'>
          <h1 className='heading--large heading--shared-content with-description'>{providerId}</h1>
          <AsyncCommands config={dropdownConfig} />
          <Link
            className='button button--small button--green form-group__element--right'
            to={'/providers/edit/' + providerId}>Edit</Link>

          {lastUpdated(provider.queriedAt)}
        </section>

        <section className='page__section'>
          {errors.length ? <ErrorReport report={errors} truncate={true} /> : null}
          <div className='heading__wrapper--border'>
            <h2 className='heading--medium with-description'>Provider Overview</h2>
          </div>
          <Metadata data={provider} accessors={metaAccessors} />
        </section>

        <section className='page__section'>
          <LogViewer
            query={logsQuery}
            dispatch={this.props.dispatch}
            logs={this.props.logs}
            notFound={`No recent logs for ${providerId}`}
          />
        </section>
      </div>
    );
  }
}

ProviderOverview.propTypes = {
  params: PropTypes.object,
  dispatch: PropTypes.func,
  providers: PropTypes.object,
  logs: PropTypes.object,
  router: PropTypes.object
};

export default connect(state => ({
  providers: state.providers,
  logs: state.logs
}))(ProviderOverview);
