import React, { PureComponent } from 'react';
import { Button } from '@vkontakte/vkui';
import connect from '@vkontakte/vkui-connect';
import Placeholder from './Placeholder';
import * as utils from '../../utils';

export default class PlaceholderNeedToken extends PureComponent {
  render() {
    return (
      <Placeholder
        title="Нет доступа"
        caption="Разрешите доступ к основной информации о&nbsp;вас"
        extra={<Button onClick={this._restoreButtonDidPress}>Разрешить</Button>}
      />
    )
  }

  _restoreButtonDidPress = () => {
    //if (utils.canAuthWithSig()) {
    //  connect.send('VKWebAppGetUserInfo', {});
    //} else {
      connect.send('VKWebAppGetAuthToken', {app_id: window.appId, scope: 'stories,notifications'});
    //}
  };
}
