import React, { PureComponent } from 'react';
import * as utils from '../../utils/index';

export default class Placeholder extends PureComponent {
  render() {
    const {
      title,
      caption,
      extra,
      type
    } = this.props;

    const iconClassName = utils.classNames({
      im_history_empty_img: true,
      [`deactivated_${type}`]: true
    });

    return (
      <div className="im_history_empty _im_history_empty">
        {type && <div className={iconClassName} />}
        <div className="im_history_empty_title">{title}</div>
        <div className="im_history_empty_text">{caption}</div>
        <div className="im_history_empty_extra">{extra}</div>
      </div>
    )
  }
}
