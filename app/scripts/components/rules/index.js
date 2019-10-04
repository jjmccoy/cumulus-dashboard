'use strict';
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import Sidebar from '../app/sidebar';

class Rules extends React.Component {
  render () {
    const { pathname } = this.props.location;
    const showSidebar = pathname !== '/rules/add';
    return (
      <div className='page__rules'>
        <div className='content__header'>
          <div className='row'>
            <h1 className='heading--xlarge heading--shared-content'>Rules</h1>
          </div>
        </div>
        <div className='page__content'>
          <div className='row wrapper__sidebar'>
            { showSidebar ? (
              <Sidebar
                currentPath={this.props.location.pathname}
                params={this.props.params}
              />
            ) : null }
            <div className={ showSidebar ? 'page__content--shortened' : 'page__content' }>
              {this.props.children}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

Rules.propTypes = {
  children: PropTypes.object,
  location: PropTypes.object,
  params: PropTypes.object
};

export default Rules;
