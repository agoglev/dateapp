import React from 'react';
import * as actionTypes from './actionTypes';
import store from '../store';
import * as actions from './index';
import * as api from '../services/api';
import * as utils from "../utils";
import * as UI from '@vkontakte/vkui';
import NotificationsPermission from '../components/NotificationsPermission/NotificationsPermission';
import * as activityActions from "./activity";
import SubscriptionBox from '../components/SubscriptionBox/SubscriptionBox';
import ImHistory from "../containers/Modals/ImHistory";
import SkipMatchBox from "../components/SkipMatchBox/SkipMatchBox";

export let hasPremium = false;

export let Prices = {
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

export function setPrices(newPrices) {
  Prices = newPrices;
}

export function setPremiumState(has) {
  hasPremium = has;
  store.dispatch({type: actionTypes.PREMIUM_SET, has});
}

export function showSubscriptionRequest(target = 'none', opts = {}) {
  actions.setPopout(<SubscriptionBox target={target} opts={opts} />);
  utils.statReachGoal('premium_box');
  utils.statReachGoal('premium_box_' + target);
}

export function buyPremium(type = 'premium', target = 'none') {
  actions.loaderShow();
  if (window.isDG) {
    api.showOrderBox(type).then(() => {
      actions.loaderSuccess();
      setPremiumState(true);
      setTimeout(() => showFeatureBox(true), 100);
      utils.statReachGoal('premium_target_' + target);
      fetchRates();
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
      //setTimeout(() => showFeatureBox(true), 100);
      utils.statReachGoal('premium_target_' + target);
      fetchRates();
    }).catch(() => actions.showError());
  }
  utils.statReachGoal('premium_continue');
}

export function buyGift(giftId, userId, message) {
  actions.vkPay(`gift`, {
    gift_id: giftId,
    user_id: userId,
    message: message
  }).then(() => {
    actions.loaderSuccess();
    window.history.back();
    setTimeout(() => {
      window.history.back();

      setTimeout(() => {
        activityActions.addGiftMessage(userId, giftId, message);
        ImHistory.scrollToBottom();
      }, 1000);
    }, 10);
  }).catch(() => actions.showError());
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
    buttonCaption={
      <UI.Button
        size="xl"
        level="secondary"
        style={{marginTop: 10}}
        onClick={() => {
          actions.setPopout();
          setTimeout(() => actions.openInvites(), 300)
        }}
      >Получить бесплатно</UI.Button>}
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
          fetchRates();
        });
      } else {
        actions.vkPay(productType).then(() => {
          actions.loaderSuccess();
          activityActions.loadFeaturedUsers();
          fetchRates();
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

export function fetchRates() {
  api.method(api.methods.rates).then(({rates}) => {
    setPrices(rates);
  });
}

export function showSkipMathcBox(user) {
  actions.setPopout(<SkipMatchBox user={user} />);
}