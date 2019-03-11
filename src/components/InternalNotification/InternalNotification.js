import './InternalNotification.css';

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import * as utils from '../../utils';

export default class InternalNotification extends PureComponent {

  static propTypes = {
    title: PropTypes.string,
    text: PropTypes.string,
    icon: PropTypes.string,
    extra: PropTypes.node,
    style: PropTypes.object
  };

  render() {
    const {
      title,
      text,
      icon,
      extra,
      style
    } = this.props;

    const iconClassName = utils.classNames({
      InternalNotification__icon: true,
      [icon]: true
    });

    return (
      <div className="InternalNotification" style={style || {}}>
        {icon && <div className={iconClassName} />}
        <div className="InternalNotification__cont">
          <div className="InternalNotification__title">{title}</div>
          <div className="InternalNotification__text">{text}</div>
          {extra}
        </div>
      </div>
    )
  }
}