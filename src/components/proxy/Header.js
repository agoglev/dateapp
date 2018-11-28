import React, { Component } from 'react';
import { PanelHeader } from '@vkontakte/vkui';

export default class Header extends Component {
  render() {
    if (window.isDesktop) {
      return (
        <div
          className="App__desktop__header"
        >
          <div className="App__desktop__header__left">{this.props.left}</div>
          <div className="App__desktop__header__cont">{this.props.children}</div>
        </div>
      )
    }
    return <PanelHeader {...this.props} />;
  }
}
