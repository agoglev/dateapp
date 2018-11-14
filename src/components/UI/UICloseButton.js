import React, { PureComponent } from 'react';

import { platform, IOS, HeaderButton } from '@vkontakte/vkui';
import Icon24Cancel from '@vkontakte/icons/dist/24/cancel';
const osname = platform();

export default class UICloseButton extends PureComponent {
  render() {
    return (
      <HeaderButton onClick={() => window.history.back()}>
        {osname === IOS ? <span>{this.props.text || "Отменить"}</span> : <Icon24Cancel/>}
      </HeaderButton>
    )
  }
}
