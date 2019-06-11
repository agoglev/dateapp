import './InternalNotification.css';

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import SVG from 'react-inlinesvg';
import { Group } from '@vkontakte/vkui';

export default class InternalNotification extends PureComponent {

  static propTypes = {
    title: PropTypes.string,
    text: PropTypes.string,
    icon: PropTypes.string,
    extra: PropTypes.node,
    style: PropTypes.object
  };

  static icons = {
    geo: require('../../asset/section_geo_16.svg')
  };

  render() {
    const {
      title,
      text,
      icon,
      extra,
      style
    } = this.props;

    return (
      <Group style={style || {}}>
        <div className="InternalNotification">
          {icon && <div className="InternalNotification__icon"><SVG src={InternalNotification.icons[icon]} /></div>}
          <div className="InternalNotification__cont">
            <div className="InternalNotification__title">{title}</div>
            <div className="InternalNotification__text">{text}</div>
            {extra}
          </div>
        </div>
      </Group>
    )
  }
}
