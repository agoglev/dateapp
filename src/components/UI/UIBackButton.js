import React, { PureComponent } from 'react';

import { platform, IOS, HeaderButton } from '@vkontakte/vkui';
import Icon28ChevronBack from '@vkontakte/icons/dist/28/chevron_back';
import Icon24Back from '@vkontakte/icons/dist/24/back';

const osname = platform();

export default class UIBackButton extends PureComponent {
  render() {
    return (
      <HeaderButton onClick={() => !this.props.skipAction && window.history.back()}>
        {osname === IOS ? <Icon28ChevronBack/> : <Icon24Back/>}
      </HeaderButton>
    )
  }
}
