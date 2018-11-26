import React, { Component } from 'react';
import { PanelHeader } from '@vkontakte/vkui';

export default class Header extends Component {
  render() {
    if (window.isDesktop) {
      return (
        <div
          {...this.props}
          className="App__desktop__header"
        />
      )
    }
    return <PanelHeader {...this.props} />;
  }
}
