import './SubscriptionBox.css';
import React, { PureComponent } from 'react';
import Icon24Cancel from '@vkontakte/icons/dist/24/back';
import * as actions from '../../actions';
import { Button } from '@vkontakte/vkui';
import * as paymentsActions from '../../actions/payments';
import * as utils from "../../utils";

export default class SubscriptionBox extends PureComponent {
  render() {
    const btnText = window.isDG ? `Месяц за ${utils.gram(paymentsActions.Prices.premium.votes, ['голос', 'голоса', 'голосов'])}` : `Месяц за ${paymentsActions.Prices.premium.rubles}₽`;
    const dayBtnText = window.isDG ? `День за ${utils.gram(paymentsActions.Prices.premiumDay.votes, ['голос', 'голоса', 'голосов'])}` : `День за ${paymentsActions.Prices.premiumDay.rubles}₽`;
    return (
      <div className="SubscriptionBox">
        <div className="SubscriptionBox__close" onClick={() => actions.setPopout()}><Icon24Cancel /></div>
        <div className="SubscriptionBox__cont">
          <div className="SubscriptionBox__icon"/>
          <div className="SubscriptionBox__title">Знакомства «Премиум»</div>
          <div className="SubscriptionBox__caption">Получите набор опций, которые помогут знакомиться успешнее</div>
          <div className="SubscriptionBox__items">
            <div className="SubscriptionBox__item">
              <div className="SubscriptionBox__item_icon likes" />
              <div className="SubscriptionBox__item_caption">Просмотр списка лайков</div>
            </div>
            <div className="SubscriptionBox__item">
              <div className="SubscriptionBox__item_icon cancel_action" />
              <div className="SubscriptionBox__item_caption">Свободная отмена действий</div>
            </div>
            <div className="SubscriptionBox__item">
              <div className="SubscriptionBox__item_icon messages" />
              <div className="SubscriptionBox__item_caption">Ваши сообщения будут читать первыми</div>
            </div>
          </div>
          <Button size="xl" level="1" style={{marginTop: 24}} onClick={() => {
            actions.setPopout();
            paymentsActions.buyPremium('premium');
          }}>{btnText}</Button>
          <Button size="xl" level="1" style={{marginTop: 12}} onClick={() => {
            actions.setPopout();
            paymentsActions.buyPremium('premium_day');
          }}>{dayBtnText}</Button>
        </div>
      </div>
    )
  }
}
