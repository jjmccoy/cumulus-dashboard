'use strict';
import React from 'react';
import { Link } from 'react-router';
import { fromNow } from '../format';

export const tableHeader = [
  'Name',
  'Host',
  'Global Connection Limit',
  'Protocol',
  'Last Updated'
];

export const tableRow = [
  (d) => <Link to={`providers/provider/${d.id}`}>{d.id}</Link>,
  'host',
  'globalConnectionLimit',
  'protocol',
  (d) => fromNow(d.timestamp)
];

export const tableSortProps = [
  'id',
  'host',
  'globalConnectionLimit',
  'protocol',
  'timestamp'
];
