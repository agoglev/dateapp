import './SubscriptionBox.css';
import React, { PureComponent } from 'react';
import Icon24Cancel from '@vkontakte/icons/dist/24/back';
import * as actions from '../../actions';
import { Button } from '@vkontakte/vkui';
import * as paymentsActions from '../../actions/payments';

export default class SubscriptionBox extends PureComponent {
  render() {
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
              <div className="SubscriptionBox__item_caption">Яркие сообщения, ваши письма не потеряются среди остальных</div>
            </div>
          </div>
          <Button size="xl" level="1" style={{marginTop: 24}} onClick={() => {
            actions.setPopout();
            paymentsActions.buyPremium();
          }}>Активировать</Button>
        </div>
      </div>
    )
  }
}
