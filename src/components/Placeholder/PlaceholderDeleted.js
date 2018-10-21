import React, { PureComponent } from 'react';
import { Button } from '@vkontakte/vkui';
import * as actions from '../../actions/index';
import * as accountActions from '../../actions/account';
import Placeholder from './Placeholder';

export default class PlaceholderDeleted extends PureComponent {
  render() {
    return (
      <Placeholder
        title="Анкета удалена"
        caption="Больше вас никто не побеспокоит, а уведомления перестанут приходить"
        type="deleted"
        extra={<Button onClick={this._restoreButtonDidPress}>Восстановить</Button>}
      />
    )
  }

  _restoreButtonDidPress = () => {
    actions.loaderShow();
    accountActions.restoreAccount()
      .then(() => actions.loaderSuccess())
      .catch(() => actions.showError('Произошла ошибка!'));
  };
}
