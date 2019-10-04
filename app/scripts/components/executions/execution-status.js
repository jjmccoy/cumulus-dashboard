'use strict';
import React from 'react';
import Collapse from 'react-collapsible';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import get from 'lodash.get';
import { getExecutionStatus } from '../../actions';
import { displayCase, fullDate, parseJson } from '../../utils/format';
import { Link } from 'react-router';

import {
  tableHeader,
  tableRow
} from '../../utils/table-config/execution-status';

import ErrorReport from '../errors/report';

import { ExecutionStatusGraph, getEventDetails } from './execution-status-graph';
import SortableTable from '../table/sortable';

class ExecutionStatus extends React.Component {
  constructor () {
    super();
    this.displayName = 'Execution';
    this.navigateBack = this.navigateBack.bind(this);
    this.errors = this.errors.bind(this);
    this.renderEvents = this.renderEvents.bind(this);
  }

  componentDidMount () {
    const { dispatch } = this.props;
    const { executionArn } = this.props.params;
    dispatch(getExecutionStatus(executionArn));
  }

  navigateBack () {
    const { router } = this.props;
    router.push('/executions');
  }

  errors () {
    return [].filter(Boolean);
  }

  renderEvents () {
    const { executionStatus } = this.props;
    let { executionHistory: { events } } = executionStatus;
    events.forEach((event) => {
      event.eventDetails = getEventDetails(event);
    });

    return (
      <SortableTable
        data={events.sort((a, b) => a.id > b.id ? 1 : -1)}
        dispatch={this.props.dispatch}
        header={tableHeader}
        row={tableRow}
        rowId='id'
        sortIdx={0}
        props={[]}
        order='asc'
        collapsible={true}
      />
    );
  }

  render () {
    const { executionStatus } = this.props;
    if (!executionStatus.execution) return null;

    const input = (executionStatus.execution.input)
      ? <dd>
        <Collapse trigger={'Show Input'} triggerWhenOpen={'Hide Input'}>
          <pre>{parseJson(executionStatus.execution.input)}</pre>
        </Collapse>
      </dd>
      : <dd>N/A</dd>;

    const output = (executionStatus.execution.output)
      ? <dd>
        <Collapse trigger={'Show Output'} triggerWhenOpen={'Hide Output'}>
          <pre>{parseJson(executionStatus.execution.output)}</pre>
        </Collapse>
      </dd>
      : <dd>N/A</dd>;

    let parentARN;
    if (executionStatus.execution.input) {
      const input = JSON.parse(executionStatus.execution.input);
      const parent = get(input.cumulus_meta, 'parentExecutionArn');
      if (parent) {
        parentARN = <dd><Link to={'/executions/execution/' + parent} title={parent}>{parent}</Link></dd>;
      } else {
        parentARN = <dd>N/A</dd>;
      }
    } else {
      parentARN = <dd>N/A</dd>;
    }

    const errors = this.errors();

    return (
      <div className='page__component'>
      <section className='page__section page__section__header-wrapper'>
        <h1 className='heading--large heading--shared-content with-description width--three-quarters'>
          Execution {executionStatus.arn}
        </h1>

        {errors.length ? <ErrorReport report={errors} /> : null}
      </section>

      {/* stateMachine's definition and executionHistory's event statuses are needed to draw the graph */}
      {(executionStatus.stateMachine && executionStatus.executionHistory)
      ? <section className='page__section width--half' style={{ display: 'inline-block', marginRight: '5%' }}>
            <div className='heading__wrapper--border'>
              <h2 className='heading--medium with-description'>Visual workflow</h2>
            </div>

            <ExecutionStatusGraph executionStatus={executionStatus} />
        </section>
      : null}

      <section className='page__section width--half' style={{ display: 'inline-block', verticalAlign: 'top' }}>
        <div className='heading__wrapper--border'>
          <h2 className='heading--medium with-description'>Execution Details</h2>
        </div>

        <dl className='status--process'>
          <dt>Execution Status:</dt>
          <dd>{displayCase(executionStatus.execution.status)}</dd><br />

          <dt>Execution Arn:</dt>
          <dd>{executionStatus.execution.executionArn}</dd><br />

          <dt>State Machine Arn:</dt>
          <dd>{executionStatus.execution.stateMachineArn}</dd><br />

          <dt>Started:</dt>
          <dd>{fullDate(executionStatus.execution.startDate)}</dd><br />

          <dt>Ended:</dt>
          <dd>{fullDate(executionStatus.execution.stopDate)}</dd><br />

          <dt>Parent Workflow Execution</dt>
          {parentARN}
          <br />

          <dt>Input:</dt>
          {input}
          <br />

          <dt>Output:</dt>
          {output}
          <br />

          <dt>Logs:</dt>
          <dd><Link to={'/executions/execution/' + executionStatus.execution.name + '/logs'} title={executionStatus.execution.name + '/logs'}>View Execution Logs</Link></dd>
          <br />
        </dl>
      </section>

      {(executionStatus.executionHistory)
      ? <section className='page__section'>
          <div className='heading__wrapper--border'>
            <h2 className='heading--medium with-description'>Events</h2>
            <p>To find all task name and versions, select <b>More details</b> for the last Lambda- or Activity-type event. There you should find a key / value pair "workflow_tasks" which lists all tasks' version, name and arn.</p>
            <p><b>NOTE:</b>Task / version tracking is enabled as of Cumulus version 1.9.1.</p>
            <p><b>NOTE:</b>If the task output is greater than 10KB, the full message will be stored in an S3 Bucket. In these scenarios, task and version numbers are not part of the Lambda or Activity event output.</p>
          </div>

          {this.renderEvents()}
        </section>
      : null}

      </div>
    );
  }
}

ExecutionStatus.propTypes = {
  executionStatus: PropTypes.object,
  params: PropTypes.object,
  dispatch: PropTypes.func,
  router: PropTypes.object
};

export { ExecutionStatus };

export default connect(state => ({
  executionStatus: state.executionStatus
}))(ExecutionStatus);
