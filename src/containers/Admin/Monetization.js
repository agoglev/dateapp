import './Admin.css';

import React from 'react';
import BaseComponent from '../../BaseComponent';
import Header from '../../components/proxy/Header';
import * as UI from '@vkontakte/vkui';
import UIBackButton from '../../components/UI/UIBackButton';
import VkConnect from "@vkontakte/vkui-connect/index";
import * as utils from '../../utils';

import Icon24Linked from '@vkontakte/icons/dist/24/linked';
import Icon24Users from '@vkontakte/icons/dist/24/users';

export default class Monetization extends BaseComponent {
  constructor(props) {
    super(props);
    utils.statReachGoal('monetization_screen');
  }

  render() {
    if (window.isDesktop) {
      return this._renderWrap();
    }

    return (
      <UI.Panel id={this.props.id}>
        {this._renderWrap()}
      </UI.Panel>
    )
  }

  _renderWrap() {
    return (
      <div>
        <Header
          left={<UIBackButton />}
        >
          Монетизация
        </Header>
        {this._renderCont()}
      </div>
    )
  }

  _renderCont() {
    return (
      <div>
      <UI.Group>
        <UI.Div>
          Если у Вас есть сообщество, в котором вы администратор, то Вы сможете заработать <b>50%</b> от покупок Ваших подписчиков в приложении.
        </UI.Div>
        <UI.Div>
          <UI.Button size="xl" onClick={() => VkConnect.send('VKWebAppAddToCommunity', {})}>Подключить сообщество</UI.Button>
        </UI.Div>
      </UI.Group>
        <UI.Group title="Ссылки">
          <UI.List>
            <UI.Cell expandable before={<Icon24Users />} href="https://vk.com/dateapp_monetization" target="_blank">Сообщество</UI.Cell>
            <UI.Cell expandable before={<Icon24Linked />} href="https://vk.com/@dateapp_monetization-info" target="_blank">Ответы на вопросы</UI.Cell>
          </UI.List>
        </UI.Group>
      </div>
    );
  }
}
