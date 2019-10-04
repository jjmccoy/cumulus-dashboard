'use strict';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import Sidebar from '../app/sidebar';
import { strings } from '../locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

class Collections extends React.Component {
  constructor () {
    super();
    this.displayName = strings.collection;
  }

  render () {
    const { pathname } = this.props.location;
    const existingCollection = pathname !== '/collections/add';
    return (
      <div className='page__collections'>
        <div className='content__header'>
          <div className='row'>
            <h1 className='heading--xlarge heading--shared-content'>{strings.collections}</h1>
          </div>
        </div>
        <div className='page__content'>
          <div className='row wrapper__sidebar'>
            {existingCollection ? <Sidebar currentPath={pathname} params={this.props.params} /> : null}
            <div className={existingCollection ? 'page__content--shortened' : 'page__content'}>
              {this.props.children}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

Collections.propTypes = {
  children: PropTypes.object,
  location: PropTypes.object,
  params: PropTypes.object
};

export default connect(state => state)(Collections);
