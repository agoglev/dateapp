import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as actions from './actions/index';

export default class BaseComponent extends Component {
  static propTypes = {
    state: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired
  };

  get data() {
    const { state, id } = this.props;
    return state.pageData[id] || {};
  }

  setData(field, value) {
    actions.setData(field, value, this.props.id);
  }

  hasData(field) {
    return this.data[field] !== void 0;
  }
}
