'use strict';
import React from 'react';
import PropTypes from 'prop-types';
import { interval, getLogs, clearLogs } from '../../actions';
import { logsUpdateInterval } from '../../config';
// import moment from 'moment';
import LoadingEllipsis from '../app/loading-ellipsis';
import ErrorReport from '../errors/report';
import Dropdown from '../form/simple-dropdown';
import { tally } from '../../utils/format';

const noLogs = {
  displayText: 'There are no Cumulus logs from the past 48 hours.',
  level: 'meta',
  key: 'no-logs-message'
};
// const twoDays = 2 * 1000 * 60 * 60 * 24;

const statusOptions = [
  'All',
  'Debug',
  'Info',
  'Warn',
  'Error',
  'Fatal',
  'Trace'
];

class LogViewer extends React.Component {
  constructor () {
    super();
    this.displayName = 'LogViewer';
    this.setSearch = this.setSearch.bind(this);
    this.setSearchLevel = this.setSearchLevel.bind(this);
    this.query = this.query.bind(this);
    this.state = {
      level: 'All',
      search: ''
    };
  }

  componentDidMount () {
    this.query();
  }

  componentDidUpdate (prevProps) {
    if (JSON.stringify(this.props.query) !== JSON.stringify(prevProps.query)) {
      const query = this.props.query || {};
      this.query(query);
    }

    if (this.props.logs.error && this.cancelInterval) {
      this.cancelInterval();
      this.cancelInterval = null;
    }
  }

  componentWillUnmount () {
    if (this.cancelInterval) { this.cancelInterval(); }
    this.props.dispatch(clearLogs());
  }

  setSearch (e) {
    const value = e.currentTarget.value;
    this.setState({ search: value }, this.query);
  }

  setSearchLevel (id, value) {
    this.setState({ search: '', level: value }, this.query);
  }

  query () {
    const query = this.props.query || {};
    const { search, level } = this.state;
    if (search) {
      query.q = this.state.search;
    } else if (level && level !== 'All') {
      query.level = level.toLowerCase();
    }
    const { dispatch } = this.props;
    if (this.cancelInterval) { this.cancelInterval(); }
    dispatch(clearLogs());

    // let isFirstPull = true;
    function querySinceLast () {
      // on first pull, get the last 48 hours

      // deactivating until timestamp filter works again on the API side
      // const duration = isFirstPull ? twoDays : logsUpdateInterval;
      // const from = moment().subtract(duration, 'milliseconds').format();
      // isFirstPull = false;
      return dispatch(getLogs(Object.assign({ }, query)));
    }
    this.cancelInterval = interval(querySinceLast, logsUpdateInterval, true);
  }

  render () {
    const { logs, notFound } = this.props;
    let items = logs.items;
    if (!items.length && !logs.inflight) {
      let placeholder = notFound ? Object.assign({}, noLogs, {
        displayText: notFound
      }) : noLogs;
      items = [placeholder];
    }
    const count = logs.items.length ? tally(items.length) : 0;
    const { level } = this.state;
    return (
      <section className='page__section'>
        <div className='heading__wrapper--border'>
          <h2 className='heading--medium heading--shared-content with-description'>Logs
            <span className='num--title'>{logs.inflight ? <LoadingEllipsis /> : '(' + count + ')'}</span>
          </h2>
          <form className='search__wrapper form-group__element form-group__element--right form-group__element--right--sm form-group__element--small'>
            <input
              className='search'
              type='search'
              placeholder='Search all logs'
              value={this.state.search}
              onChange={this.setSearch}/>
            <span className='search__icon'></span>
          </form>

          <form className='search__wrapper form-group__element form-group__element--right form-group__element--right--sm form-group__element--small'>
            <Dropdown
              label={'Level'}
              value={level}
              options={statusOptions}
              id={'logs-viewer-dropdown'}
              onChange={this.setSearchLevel}
              noNull={true}
            />
          </form>
        </div>
        {logs.error ? <ErrorReport report={logs.error} truncate={true} /> : null}
        <div className='logs'>
          {items.map((d, i) => {
            let text = d.displayText;
            if (text.length > 200) {
              text = text.slice(0, 200) + '...';
            }
            let level;
            if (d.level) {
              if (d.level === 30) level = 'info';
              else level = d.level.toString().toLowerCase();
            } else {
              level = 'info';
            }

            return <p
              key={d.key}
              className='logs__item'><span className='logs__item--date'>{d.displayTime}</span> <span className={'logs__item--level logs__item--' + level}>{level}</span> {text}</p>;
          })}
        </div>
      </section>
    );
  }
}

LogViewer.propTypes = {
  dispatch: PropTypes.func,
  query: PropTypes.object,
  logs: PropTypes.object,
  notFound: PropTypes.string
};

export default LogViewer;
