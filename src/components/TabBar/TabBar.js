import './TabBar.css';
import React, { Component } from 'react';
import * as utils from '../../utils';
import * as actions from '../../actions';

export default class TabBar extends Component {
  componentDidMount() {
    utils.initYAAds();
  }

  render() {
    return (
      <div className="TabBar">
        <div className="TabBar__cont">
          {this._renderTabs()}
        </div>
        <div className="TabBar__helper" />
        <div id="yandex_rtb_R-A-325915-2" />
      </div>
    )
  }

  _renderTabs() {
    const state = this.props.state;
    return ['cards', 'messages', 'profile'].map((tab) => {
      const className = utils.classNames({
        TabBar__item: true,
        active: state.activeTab === tab,
        hasBadge: tab === 'messages' && this.props.state.hasBadge
      });

      return (
        <div
          className={className}
          onClick={() => actions.setTab(tab)}
          key={tab}
        >
          <div className={`TabBar__item-icon ${tab}`} />
        </div>
      )
    });
  }
}
