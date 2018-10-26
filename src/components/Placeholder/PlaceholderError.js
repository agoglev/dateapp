import React, { PureComponent } from 'react';
import { Button } from '@vkontakte/vkui';
import Placeholder from './Placeholder';
import * as actions from '../../actions';

export default class PlaceholderError extends PureComponent {
  render() {
    return (
      <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%'}}>
        <Placeholder
          title="Произошла ошибка"
          caption=""
          extra={<Button onClick={this._retryDidPress}>Повторить попытку</Button>}
        />
      </div>
    )
  }

  _retryDidPress = () => actions.initRetry();
}
