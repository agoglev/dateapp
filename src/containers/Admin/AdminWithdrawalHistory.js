import './Admin.css';

import React from 'react';
import BaseComponent from '../../BaseComponent';
import Header from '../../components/proxy/Header';
import * as UI from '@vkontakte/vkui';
import UIBackButton from '../../components/UI/UIBackButton';

export default class AdminWithdrawalHistory extends BaseComponent {
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
          История выводов
        </Header>
        {this._renderCont()}
      </div>
    )
  }

  _renderCont() {
    if (this.data.history.length === 0) {
      return <div className="Likes__empty">История пуста</div>
    }

    return (
      <div>
        {this._renderHistory()}
      </div>
    );
  }

  _renderHistory() {
    return this.data.history.map((item) => {
      let status = '';
      switch (item.status) {
        case 'pending':
          status = item.amount ? 'Обрабатывается' : 'Ожидание';
          break;
        case 'cancelled':
          status = 'Отклонен';
          break;
        case 'accepted':
          status = 'Выполнено';
          break;
      }

      return (
        <UI.Group key={item.id}>
          <UI.List>
            <UI.Cell>
              <UI.InfoRow title="Статус">{status}</UI.InfoRow>
            </UI.Cell>
            <UI.Cell>
              <UI.InfoRow title="Дата">{item.date}</UI.InfoRow>
            </UI.Cell>
              {item.amount && <UI.Cell><UI.InfoRow title="Количество">{item.amount}₽</UI.InfoRow></UI.Cell>}
            <UI.Cell>
              <UI.InfoRow title="Получатель">{item.user_name}</UI.InfoRow>
            </UI.Cell>
          </UI.List>
        </UI.Group>
      )
    });
  }
}
