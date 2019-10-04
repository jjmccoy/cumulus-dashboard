'use strict';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { lastUpdated } from '../../utils/format';
import LogViewer from '../logs/viewer';
import {strings} from '../locale';

class CollectionLogs extends React.Component {
  constructor () {
    super();
    this.displayName = strings.collection_logs;
  }

  render () {
    const collectionName = this.props.params.name;
    const { queriedAt } = this.props.logs;
    return (
      <div className='page__component'>
        <section className='page__section'>
          <h1 className='heading--large heading--shared-content with-description'>{collectionName}</h1>
          <Link className='button button--small form-group__element--right button--green' to={`/collections/edit/${collectionName}`}>Edit</Link>
          {lastUpdated(queriedAt)}
        </section>
        <LogViewer query={{ q: collectionName }} dispatch={this.props.dispatch} logs={this.props.logs}/>
      </div>
    );
  }
}

CollectionLogs.propTypes = {
  dispatch: PropTypes.func,
  params: PropTypes.object,
  logs: PropTypes.object
};

export default connect(state => ({
  logs: state.logs
}))(CollectionLogs);
