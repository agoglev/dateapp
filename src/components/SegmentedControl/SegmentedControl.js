import './SegmentedControl.css';

import React, { PureComponent } from 'react';
import * as utils from '../../utils/index';

export default class SegmentedControl extends PureComponent {
  render() {
    return (
      <div className="SegmentedControl">
        {this._renderItems()}
      </div>
    )
  }

  _renderItems() {
    return this.props.items.map((item) => {
      const className = utils.classNames({
        SegmentedControl__item: true,
        selected: this.props.selected === item.id
      });

      return (
        <div
          className={className}
          key={item.id}
          onClick={() => this.props.onSelect(item.id)}
        >
          {item.text}
        </div>
      )
    });
  }
}
