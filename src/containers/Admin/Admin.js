import './Admin.css';

import React from 'react';
import BaseComponent from '../../BaseComponent';
import Header from '../../components/proxy/Header';
import * as UI from '@vkontakte/vkui';
import UIBackButton from '../../components/UI/UIBackButton';
import * as utils from '../../utils';
import * as actions from '../../actions';
import * as partner from '../../actions/partner';

import Icon24Linked from '@vkontakte/icons/dist/24/linked';
import Icon24Users from '@vkontakte/icons/dist/24/users';
import connect from "@vkontakte/vkui-connect/index";

export default class Admin extends BaseComponent {
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
          Админка
        </Header>
        {this._renderCont()}
      </div>
    )
  }

  _renderCont() {
    return (
      <div>
        <UI.Group title="Статистика">
          <div className="Admin__stats">
            <div className="Admin__stats__row">
              <div className="Admin__stats__row__value">{this.data.membersCount}</div>
              <div className="Admin__stats__row__label">{utils.gram(this.data.membersCountInt, ['участник всего', 'участника всего', 'участников всего'], true)}</div>
            </div>
            <div className="Admin__stats__row">
              <div className="Admin__stats__row__value">{this.data.membersToday}</div>
              <div className="Admin__stats__row__label">{utils.gram(this.data.membersTodayInt, ['заходил сегодня', 'заходили сегодня', 'заходили сегодня'], true)}</div>
            </div>
          </div>
        </UI.Group>
        <UI.Group title="Монетизация" description={this.data.canEnable ? '' : this.data.canEnabledFrom}>
          <UI.Div>Половина от покупок внутри сообщества — ваша.</UI.Div>
          {this._renderMonetization()}
        </UI.Group>
        <UI.Group title="Ссылки">
          <UI.List>
            <UI.Cell expandable before={<Icon24Users />} href="https://vk.com/dateapp_monetization" target="_blank">Сообщество</UI.Cell>
            <UI.Cell expandable before={<Icon24Linked />} href="https://vk.com/@dateapp_monetization-info" target="_blank">Ответы на вопросы</UI.Cell>
          </UI.List>
        </UI.Group>
        <UI.Group>
          <UI.Div>
            <UI.FormStatus title="Делитесь приложением" onClick={() => connect.send('VKWebAppShare', {link: `https://vk.com/app6682509_-${window.GroupId}`})}>
              Расскажите своим подписчикам о приложении, чем больше людей заходит в сервис, тем больше Вы зарабатываете.
              <div style={{marginTop: 10}}>
                <UI.Button>Поделиться приложением</UI.Button>
              </div>
            </UI.FormStatus>
          </UI.Div>
        </UI.Group>
      </div>
    );
  }

  _renderMonetization() {
    if (this.data.enabled) {
      return (
        <div>
          <div className="Admin__stats">
            <div className="Admin__stats__row">
              <div className="Admin__stats__row__value">{this.data.moneyTotal}</div>
              <div className="Admin__stats__row__label">Всего заработано</div>
            </div>
            <div className="Admin__stats__row">
              <div className="Admin__stats__row__value">{this.data.moneyToday}</div>
              <div className="Admin__stats__row__label">Сегодня</div>
            </div>
            <div className="Admin__stats__row">
              <div className="Admin__stats__row__value">{this.data.moneyAvail}</div>
              <div className="Admin__stats__row__label">К снятию</div>
            </div>
          </div>
          <UI.Div>
            {this._renderWithdrawal()}
            <UI.Button size="xl" level="tertiary" onClick={() => actions.openAdminWithdrawal()} style={{marginTop: 12}}>История выводов</UI.Button>
          </UI.Div>
        </div>
      )
    } else {
      return (
        <UI.Div>
          <UI.Button size="xl" disabled={!this.data.canEnable} onClick={this._enable}>Включить</UI.Button>
        </UI.Div>
      )
    }
  }

  _renderWithdrawal() {
    if (this.data.hasWithdrawal) {
      return 'Запрос на вывод обрабатывается.';
    } else if (this.data.canWithdrawal) {
      return <UI.Button size="xl" onClick={this._withdrawal}>Вывести средства</UI.Button>;
    } else {
      return this.data.withdrawalLimitMsg;
    }
  }

  _enable = () => {
    actions.loaderShow();
    partner.enable()
      .then(() => actions.loaderSuccess())
      .catch((err) => actions.showError(err.message));
  };

  _withdrawal = () => {
    actions.showAlert('Вывод средств', 'Все доступные деньги будут отправленны на Ваш аккаунт VK Pay в течении 3 суток. Вы действительно хотите вывести средства?', 'Да').then(() => {
      actions.loaderShow();
      partner.withdrawal()
        .then(() => actions.loaderSuccess())
        .catch((err) => actions.showError(err.message));
    });
  };
}
