'use strict';
import React from 'react';
import { Link } from 'react-router';
import Sidebar from '../app/sidebar';
import PropTypes from 'prop-types';

class Providers extends React.Component {
  constructor () {
    super();
    this.displayName = 'Providers';
  }

  render () {
    const { pathname } = this.props.location;
    const showSidebar = pathname !== '/providers/add';
    return (
      <div className='page__providers'>
        <div className='content__header'>
          <div className='row'>
            <h1 className='heading--xlarge heading--shared-content'>Providers</h1>
          </div>
        </div>
        <div className='page__content'>
          <div className='row wrapper__sidebar'>
            {showSidebar ? <Sidebar
              currentPath={this.props.location.pathname}
              params={this.props.params}
            /> : null}
            <div className={ showSidebar ? 'page__content--shortened' : 'page__content' }>
              {this.props.children}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

Providers.propTypes = {
  children: PropTypes.object,
  location: PropTypes.object,
  params: PropTypes.object
};

export default Providers;
