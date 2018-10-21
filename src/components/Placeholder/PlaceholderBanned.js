import React, { PureComponent } from 'react';
import Placeholder from './Placeholder';

export default class PlaceholderBanned extends PureComponent {
  render() {
    return (
      <Placeholder
        title="Анкета заблокирована"
        caption="Несколько участников пожаловались на&nbsp;вас. Если модераторы не найдут нарушений, вас скоро восстановят"
        type="banned"
      />
    )
  }
}
