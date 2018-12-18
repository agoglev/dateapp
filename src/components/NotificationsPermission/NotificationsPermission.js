import './NotificationsPermission.css';

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import * as actions from '../../actions/index';
import * as utils from '../../utils';
import { Button } from '@vkontakte/vkui';

export default class NotificationsPermission extends Component {

  componentDidMount() {
    const node = ReactDOM.findDOMNode(this.refs['wrap']);
    node.addEventListener('touchmove', this._preventEvent);
  }

  componentWillUnmount() {
    const node = ReactDOM.findDOMNode(this.refs['wrap']);
    node.removeEventListener('touchmove', this._preventEvent);
  }

  render() {
    const {
      type,
      title,
      caption,
      onClick,
      button,
      href,
      buttonCaption
    } = this.props;

    const iconClassName = utils.classNames({
      permissions_modal_icon: true,
      [type]: true
    });

    let buttonEl = <Button size="xl" level="1" style={{marginTop: 24}} onClick={() => {
      onClick && onClick();
      actions.setPopout();
    }}>{button ? button : "Включить"}</Button>;

    if (href) {
      buttonEl = <a href={href} target="_blank">{buttonEl}</a>
    }

    return (
      <div className="permissions_modal_wrap" ref="wrap">
        <div className="permissions_modal">
          <div className="permissions_close" onClick={() => actions.setPopout()} />
          <div className={iconClassName} />
          <div className="permissions_modal_title">{title}</div>
          <div className="permissions_caption">{caption}</div>
          {buttonEl}
          {buttonCaption}
        </div>
      </div>
    )
  }

  _preventEvent = (event) => {
    utils.cancelEvent(event);
  };
}