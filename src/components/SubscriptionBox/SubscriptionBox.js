import './SubscriptionBox.css';
import React, { PureComponent } from 'react';
import Icon24Cancel from '@vkontakte/icons/dist/24/back';
import * as actions from '../../actions';
import { Button } from '@vkontakte/vkui';
import * as paymentsActions from '../../actions/payments';
import * as utils from "../../utils";

export default class SubscriptionBox extends PureComponent {
  render() {
    let prices;
    if (window.isDG) {
      prices = {
        day: utils.gram(paymentsActions.Prices.premiumDay.votes, ['голос', 'голоса', 'голосов']),
        weak: utils.gram(paymentsActions.Prices.premiumWeak.votes, ['голос', 'голоса', 'голосов']),
        month: utils.gram(paymentsActions.Prices.premiumMonth.votes, ['голос', 'голоса', 'голосов'])
      };
    } else {
      prices = {
        day: utils.gram(paymentsActions.Prices.premiumDay.rubles, ['рубль', 'рубля', 'рублей']),
        weak: utils.gram(paymentsActions.Prices.premiumWeak.rubles, ['рубль', 'рубля', 'рублей']),
        month: utils.gram(paymentsActions.Prices.premiumMonth.rubles, ['рубль', 'рубля', 'рублей'])
      };
    }
    const vkPayInfo = window.isDG ? null : <div className="VKPay_info">Безопасный платеж через <div className="VKPay_icon" /></div>;
    return (
      <div className="SubscriptionBox">
        <div className="SubscriptionBox__close" onClick={() => actions.setPopout()}><Icon24Cancel /></div>
        <div className="SubscriptionBox__cont">
          <div className="SubscriptionBox__icon"/>
          <div className="SubscriptionBox__title">Знакомства «Премиум»</div>
          <div className="SubscriptionBox__caption">Получите набор опций, которые помогут знакомиться успешнее</div>
          <div className="SubscriptionBox__items">
            {this._renderItems()}
          </div>
          <div className="SubscriptionBox__pay_buttons">
            <div className="SubscriptionBox__pay_button">
              <div className="SubscriptionBox__pay_button__title">День</div>
              <div className="SubscriptionBox__pay_button__price">{prices.day}</div>
              <div className="SubscriptionBox__pay_button__buy" onClick={() => this._rateDidPress('day')}>Получить</div>
            </div>
            <div className="SubscriptionBox__pay_button">
              <div className="SubscriptionBox__pay_button__badge">популярно</div>
              <div className="SubscriptionBox__pay_button__title">Неделя</div>
              <div className="SubscriptionBox__pay_button__price">{prices.weak}</div>
              <div className="SubscriptionBox__pay_button__buy" onClick={() => this._rateDidPress('weak')}>Получить</div>
            </div>
            <div className="SubscriptionBox__pay_button">
              <div className="SubscriptionBox__pay_button__badge green">выгодно</div>
              <div className="SubscriptionBox__pay_button__title">Месяц</div>
              <div className="SubscriptionBox__pay_button__price">{prices.month}</div>
              <div className="SubscriptionBox__pay_button__buy" onClick={() => this._rateDidPress('month')}>Получить</div>
            </div>
          </div>
          {vkPayInfo}
        </div>
      </div>
    )
  }

  _rateDidPress = (rate) => {
    const target = this.props.target;
    actions.setPopout();
    paymentsActions.buyPremium(`premium_${rate}`, target);
  };

  _renderItems() {
    return [
      {type: 'likes', label: 'Узнайте, кому вы понравились'},
      {type: 'cancel_action', label: 'Отмените свое «нет» в «Карточках»'},
      {type: 'messages', label: 'Пусть ваши сообщения читают в первую очередь'},
      {type: 'invisible', label: 'Станьте невидимкой'},
      {type: 'fav', label: 'Узнайте, кто добавил вас в "Избранные"'},
    ].map((item) => {
      const className = utils.classNames({
        SubscriptionBox__item: true,
        animate: item.type === this.props.target
      });

      return (
        <div className={className} key={item.type}>
          <div className={`SubscriptionBox__item_icon ${item.type}`} />
          <div className="SubscriptionBox__item_caption">{item.label}</div>
        </div>
      )
    });
  }
}
