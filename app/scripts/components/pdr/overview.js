'use strict';
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { get } from 'object-path';
import { interval, listPdrs, getCount } from '../../actions';
import { lastUpdated, tally, displayCase } from '../../utils/format';
import { bulkActions } from '../../utils/table-config/pdrs';
import { tableHeader, tableRow, tableSortProps } from '../../utils/table-config/pdr-progress';
import List from '../table/list-view';
import Overview from '../app/overview';
import { updateInterval } from '../../config';

class PdrOverview extends React.Component {
  constructor () {
    super();
    this.displayName = 'PdrOverview';
    this.queryStats = this.queryStats.bind(this);
    this.generateQuery = this.generateQuery.bind(this);
    this.generateBulkActions = this.generateBulkActions.bind(this);
    this.renderOverview = this.renderOverview.bind(this);
  }

  componentDidMount () {
    this.cancelInterval = interval(this.queryStats, updateInterval, true);
  }

  componentWillUnmount () {
    if (this.cancelInterval) { this.cancelInterval(); }
  }

  queryStats () {
    this.props.dispatch(getCount({
      type: 'pdrs',
      field: 'status'
    }));
  }

  generateQuery () {
    return {};
  }

  generateBulkActions () {
    return bulkActions(this.props.pdrs);
  }

  renderOverview (count) {
    const overview = count.map(d => [tally(d.count), displayCase(d.key)]);
    return <Overview items={overview} inflight={false} />;
  }

  render () {
    const { stats } = this.props;
    const { list } = this.props.pdrs;
    const { count, queriedAt } = list.meta;
    // create the overview boxes
    const pdrCount = get(stats.count, 'data.pdrs.count', []);
    const overview = this.renderOverview(pdrCount);
    return (
      <div className='page__component'>
        <section className='page__section page__section__header-wrapper'>
          <h1 className='heading--large heading--shared-content with-description'>PDR Overview</h1>
          {lastUpdated(queriedAt)}
          {overview}
        </section>
        <section className='page__section'>
          <div className='heading__wrapper--border'>
            <h2 className='heading--medium heading--shared-content with-description'>All PDRs <span className='num--title'>{count ? ` ${tally(count)}` : null}</span></h2>
          </div>

          <List
            list={list}
            dispatch={this.props.dispatch}
            action={listPdrs}
            tableHeader={tableHeader}
            tableRow={tableRow}
            tableSortProps={tableSortProps}
            sortIdx={5}
            query={this.generateQuery()}
            bulkActions={this.generateBulkActions()}
            rowId={'pdrName'}
          />
          <Link className='link--secondary link--learn-more' to='/pdrs/active'>View Currently Active PDRs</Link>
        </section>
      </div>
    );
  }
}

PdrOverview.propTypes = {
  dispatch: PropTypes.func,
  pdrs: PropTypes.object,
  stats: PropTypes.object
};

export default connect(state => ({
  stats: state.stats,
  pdrs: state.pdrs
}))(PdrOverview);
