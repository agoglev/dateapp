import React from 'react';
import * as actionTypes from './actionTypes';
import store from '../store';
import * as actions from './index';
import * as api from '../services/api';
import * as utils from "../utils";
import NotificationsPermission from '../components/NotificationsPermission/NotificationsPermission';
import * as activityActions from "./activity";

export let hasPremium = false;

export const Prices = {
  premium: {
    votes: 8,
    rubles: 69
  },
  feature: {
    votes: 7,
    rubles: 29
  },
  wantToTalk: {
    votes: 7,
    rubles: 49
  }
};

export function setPremiumState(has) {
  hasPremium = has;
  store.dispatch({type: actionTypes.PREMIUM_SET, has});
}

export function showSubscriptionRequest() {
  const btnText = window.isDG ? `Месяц за ${utils.gram(Prices.premium.votes, ['голос', 'голоса', 'голосов'])}` : `Месяц за ${Prices.premium.rubles}₽`;
  actions.setPopout(<NotificationsPermission
    title="Передумали?"
    caption="Вам нужен Знакомства «Премиум». Вы сможете принять решение заново!"
    type="likes"
    button={btnText}
    onClick={() => {
      buyPremium();
    }}
  />);

  utils.statReachGoal('premium_box');
}

export function buyPremium() {
  actions.loaderShow();
  if (window.isDG) {
    api.showOrderBox('premium2').then(() => {
      actions.loaderSuccess();
      setPremiumState(true);
    }).catch((isFailed) => {
      if (isFailed) {
        actions.showError();
      } else {
        actions.loaderHide();
      }
    });
  } else {
    actions.vkPay('premium').then(() => {
      setPremiumState(true);
      actions.loaderSuccess();
    }).catch(() => actions.showError());
  }
  utils.statReachGoal('premium_continue');
}

export function showFeatureBox() {
  const btnText = window.isDG ? `Получить за ${utils.gram(Prices.feature.votes, ['голос', 'голоса', 'голосов'])}` : `Получить за ${Prices.feature.rubles}₽`;
  actions.setPopout(<NotificationsPermission
    title="Привлеките больше внимания!"
    caption="Окажитесь на виду у всех — разместите анкету над сообщениями"
    type="likes"
    button={btnText}
    onClick={() => {
      actions.loaderShow();

      if (window.isDG) {
        api.showOrderBox('feature_feed').then(() => {
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
        actions.vkPay('feature').then(() => {
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
  actions.setPopout(<NotificationsPermission
    title="Больше сообщений"
    caption="Пусть все знают, что вы онлайн и хотите общаться!"
    type="share"
    button={btnText}
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
