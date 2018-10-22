import React, { PureComponent } from 'react';
import { Button } from '@vkontakte/vkui';
import connect from '@vkontakte/vkui-connect';
import Placeholder from './Placeholder';
import * as utils from '../../utils';

export default class PlaceholderWorks extends PureComponent {
  render() {
    return (
      <Placeholder
        title="Технические работы"
        caption="Проходят технические работы, попробуйте зайти позже"
      />
    )
  }
}
