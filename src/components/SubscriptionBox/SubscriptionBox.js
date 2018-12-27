import './SubscriptionBox.css';
import React, { PureComponent } from 'react';
import Icon24Cancel from '@vkontakte/icons/dist/24/back';
import * as actions from '../../actions';
import { Button } from '@vkontakte/vkui';
import * as paymentsActions from '../../actions/payments';
import * as utils from "../../utils";

export default class SubscriptionBox extends PureComponent {
  render() {
    const target = this.props.target;
    const btnText = window.isDG ? `Месяц за ${utils.gram(paymentsActions.Prices.premium.votes, ['голос', 'голоса', 'голосов'])}` : `Месяц за ${paymentsActions.Prices.premium.rubles}₽`;
    const dayBtnText = window.isDG ? `День за ${utils.gram(paymentsActions.Prices.premiumDay.votes, ['голос', 'голоса', 'голосов'])}` : `День за ${paymentsActions.Prices.premiumDay.rubles}₽`;
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
            <Button size="xl" level="2" onClick={() => {
              actions.setPopout();
              paymentsActions.buyPremium('premium_day', target);
            }}>{dayBtnText}</Button>
            <Button size="xl" level="2" onClick={() => {
              actions.setPopout();
              paymentsActions.buyPremium('premium', target);
            }}>{btnText}</Button>
          </div>
          {vkPayInfo}
        </div>
      </div>
    )
  }

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
