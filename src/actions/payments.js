import React from 'react';
import * as actionTypes from './actionTypes';
import store from '../store';
import * as actions from './index';
import * as api from '../services/api';
import * as utils from "../utils";
import NotificationsPermission from '../components/NotificationsPermission/NotificationsPermission';
import * as activityActions from "./activity";
import SubscriptionBox from '../components/SubscriptionBox/SubscriptionBox';

export let hasPremium = false;

export const Prices = {
  premium: {
    votes: 10,
    rubles: 99
  },
  premiumDay: {
    votes: 2,
    rubles: 19
  },
  feature: {
    votes: 6,
    rubles: 48
  },
  featureSale: {
    votes: 3,
    rubles: 24
  },
  wantToTalk: {
    votes: 3,
    rubles: 21
  }
};

export function setPremiumState(has) {
  hasPremium = has;
  store.dispatch({type: actionTypes.PREMIUM_SET, has});
}

export function showSubscriptionRequest() {
  actions.setPopout(<SubscriptionBox />);
  utils.statReachGoal('premium_box');
}

export function buyPremium(type = 'premium') {
  actions.loaderShow();
  if (window.isDG) {
    api.showOrderBox(type).then(() => {
      actions.loaderSuccess();
      setPremiumState(true);
      setTimeout(() => showFeatureBox(true), 100);
    }).catch((isFailed) => {
      if (isFailed) {
        actions.showError();
      } else {
        actions.loaderHide();
      }
    });
  } else {
    actions.vkPay(type).then(() => {
      setPremiumState(true);
      actions.loaderSuccess();
      setTimeout(() => showFeatureBox(true), 100);
    }).catch(() => actions.showError());
  }
  utils.statReachGoal('premium_continue');
}

export function showFeatureBox(isSale = false) {
  let btnText;
  if (isSale) {
    btnText = window.isDG ? `Получить за ${utils.gram(Prices.featureSale.votes, ['голос', 'голоса', 'голосов'])}` : `Получить за ${Prices.featureSale.rubles}₽`;
  } else {
    btnText = window.isDG ? `Получить за ${utils.gram(Prices.feature.votes, ['голос', 'голоса', 'голосов'])}` : `Получить за ${Prices.feature.rubles}₽`;
  }

  let text = 'Окажитесь на виду у всех — разместите анкету над сообщениями';
  if (isSale) {
    const oldPrice = window.isDG ? utils.gram(Prices.feature.votes, ['голос', 'голоса', 'голосов']) : `${Prices.feature.rubles}₽`;
    text = <span>
      <div>Окажитесь на виду у всех — разместите анкету над сообщениями</div>
      <div style={{marginTop: '20px', color: '#000'}}>Получите услугу со скидкой <b>50%</b> только сейчас! Старая цена <b>{oldPrice}</b></div>
    </span>;
  }

  const buttonCaption = window.isDG ? null : <div className="VKPay_info">Безопасный платеж через <div className="VKPay_icon" /></div>;

  const productType = isSale ? 'feature_sale' : 'feature';
  actions.setPopout(<NotificationsPermission
    title="Привлеките больше внимания!"
    caption={text}
    type="likes"
    button={btnText}
    buttonCaption={buttonCaption}
    onClick={() => {
      actions.loaderShow();

      if (window.isDG) {
        api.showOrderBox(productType).then(() => {
          actions.loaderSuccess();
          activityActions.loadFeaturedUsers();
        }).catch((isFailed) => {
          if (isFailed) {
            actions.showError();
          } else {
            actions.loaderHide();
          }
        });
      } else {
        actions.vkPay(productType).then(() => {
          actions.loaderSuccess();
          activityActions.loadFeaturedUsers();
        }).catch(() => actions.showError());
      }

      utils.statReachGoal('feature_buy_btn');
    }}
  />);

  utils.statReachGoal('feature_btn');
}

export function showWantToTalkBox() {
  const btnText = window.isDG ? `Получить за ${utils.gram(Prices.wantToTalk.votes, ['голос', 'голоса', 'голосов'])}` : `Получить за ${Prices.wantToTalk.rubles}₽`;
  const buttonCaption = window.isDG ? null : <div className="VKPay_info">Безопасный платеж через <div className="VKPay_icon" /></div>;
  actions.setPopout(<NotificationsPermission
    title="Больше сообщений"
    caption="Пусть все знают, что вы онлайн и хотите общаться!"
    type="share"
    button={btnText}
    buttonCaption={buttonCaption}
    onClick={() => {
      actions.loaderShow();
      if (window.isDG) {
        api.showOrderBox('want_to_talk').then(() => {
          actions.loaderHide();
          wantToTalkSuccess();
        }).catch((isFailed) => {
          if (isFailed) {
            actions.showError();
          } else {
            actions.loaderHide();
          }
        });
      } else {
        actions.vkPay('want_to_talk').then(() => {
          actions.loaderHide();
          wantToTalkSuccess();
        }).catch(() => actions.showError());
      }
    }}
  />);
}

function wantToTalkSuccess() {
  const state = store.getState();
  let msg = utils.genderText(state.usersInfo[state.userId].gender, [
    'Девушки из вашего города будут видеть, что вы хотите общаться в течении 24 часов',
    'Парни из вашего города будут видеть, что вы хотите общаться в течении 24 часов'
  ]);
  actions.showAlert('Успешно!', msg, 'Закрыть', {
    skipCancelButton: true
  });
}
