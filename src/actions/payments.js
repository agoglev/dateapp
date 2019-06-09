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
import Proxy from '../services/proxy_sdk/proxy';
import Icon24Cancel from '@vkontakte/icons/dist/24/cancel';
import * as native from '../services/native';

export let hasPremium = false;

export const PromoBits = {
  story: 1 << 0,
};

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
  },
  premiumWeek: {
    votes: 3,
    rubles: 21
  },
  premiumMonth: {
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
  if (!window.isOK) {
    actions.loaderShow();
  }

  if (window.isNative) {
    actions.loaderShow();
    native.purchase(type).then(() => {
      actions.loaderSuccess();
      setPremiumState(true);
      utils.statReachGoal('premium_target_' + target);
    }).catch(() => actions.showError());
  } else if (window.isDG && window.isDesktop && false) {
    Proxy.showSubscriptionBox('month').then(() => {
      actions.loaderSuccess();
      setPremiumState(true);
      setTimeout(() => showFeatureBox(true), 100);
      utils.statReachGoal('premium_target_' + target);
    }).catch(() => actions.showError());
  } else if (window.isOK) {
    window.okPayRequestType = type;
    let key = type === 'premium_month' ? 'premium' : 'premiumDay';
    window.FAPI.UI.showPayment('Знакомства «Премиум»', '', type, Prices[key].rubles, null, null, 'ok', 'true');
  } else if (window.isDG) {
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
      setTimeout(() => showFeatureBox(true), 100);
      utils.statReachGoal('premium_target_' + target);
      fetchRates();
    }).catch((error) => {
      if (error) {
        actions.showError();
      }
    });
  }
  utils.statReachGoal('premium_continue');
}

export function buyGift(giftId, userId, message, target) {
  actions.vkPay(`gift`, {
    gift_id: giftId,
    user_id: userId,
    message: message
  }).then(() => {
    actions.loaderSuccess();
    window.history.back();
    setTimeout(() => {
      if (target !== 'im_history') {
        window.history.back();
      }

      setTimeout(() => {
        activityActions.addGiftMessage(userId, giftId, message);
        ImHistory.scrollToBottom();
      }, 1000);
    }, 10);
  }).catch((error) => {
    if (error) {
      actions.showError();
    }
  });
}

export function showFeatureBox(isSale = false) {
  let btnText;
  if (isSale) {
    btnText = window.isDG ? `Получить за ${utils.gram(Prices.featureSale.votes, ['голос', 'голоса', 'голосов'])}` : `Получить за ${Prices.featureSale.rubles}₽`;
  } else {
    btnText = window.isDG ? `Получить за ${utils.gram(Prices.feature.votes, ['голос', 'голоса', 'голосов'])}` : `Получить за ${Prices.feature.rubles}₽`;
  }

  const state = store.getState();
  const user = state.usersInfo[state.userId];
  let text = utils.genderText(user.gender, [
    'Разместите анкету над сообщениями и Вас увидят тысячи девушек!',
    'Разместите анкету над сообщениями и Вас увидят тысячи парней!'
  ]);
  if (isSale) {
    const oldPrice = window.isDG ? utils.gram(Prices.feature.votes, ['голос', 'голоса', 'голосов']) : `${Prices.feature.rubles}₽`;
    text = <span>
      <div>{text}</div>
      <div style={{marginTop: '20px', color: '#000'}}>Получите услугу со скидкой <b>50%</b> только сейчас! Старая цена <b>{oldPrice}</b></div>
    </span>;
  }

  const buttonCaption = window.isDG ? null : <div className="VKPay_info">Безопасный платеж через <div className="VKPay_icon" /></div>;

  let photos;
  if (user.gender === 1) {
    photos = [
      require('../asset/promo/man_1.jpg'),
      require('../asset/promo/man_2.jpg'),
      require('../asset/promo/man_3.jpg'),
      require('../asset/promo/man_4.jpg'),
    ];
  } else {
    photos = [
      require('../asset/promo/1.jpg'),
      require('../asset/promo/2.jpg'),
      require('../asset/promo/3.jpg'),
      require('../asset/promo/4.jpg'),
      require('../asset/promo/5.jpg'),
    ];
  }
  const randItem = Math.floor(Math.random() * (photos.length - 1));
  const selectedPhotos = photos.splice(randItem, 2);

  actions.setPopout(<UI.PopoutWrapper>
    <div className="FeatureBox">
      <div className="FeatureBox__close" onClick={() => actions.setPopout()}><Icon24Cancel /></div>
      <div className="FeatureBox__photos">
        <div className="FeatureBox__photo first" style={{backgroundImage: `url(${selectedPhotos[0]})`}} />
        <div className="FeatureBox__photo user" style={{backgroundImage: `url(${user.small_photo})`}} />
        <div className="FeatureBox__photo last" style={{backgroundImage: `url(${selectedPhotos[1]})`}} />
      </div>
      <div className="FeatureBox__title">Больше посетителей</div>
      <div className="FeatureBox__caption">{text}</div>
      <UI.Button size="l" style={{marginTop: 24}} onClick={() => {
        featureBuy(isSale);
        actions.setPopout();
      }}>{btnText}</UI.Button>
    </div>
  </UI.PopoutWrapper>);
  return;

  const productType = isSale ? 'feature_sale' : 'feature';
  actions.setPopout(<NotificationsPermission
    title="Привлеките больше внимания!"
    caption={text}
    type="likes"
    button={btnText}
    buttonCaption={
      window.isDG || window.isOK ? null : <UI.Button
        size="xl"
        level="secondary"
        style={{marginTop: 10}}
        onClick={() => {
          actions.setPopout();
          setTimeout(() => actions.openInvites(), 300)
        }}
      >Получить бесплатно</UI.Button>}
    onClick={() => {
      if (!window.isOK) {
        actions.loaderShow();
      }

      if (window.isOK) {
        window.okPayRequestType = 'feature';
        window.FAPI.UI.showPayment('Больше посетителей', '', 'feature', Prices.feature.rubles, null, null, 'ok', 'true');
      } else if (window.isDG) {
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
        }).catch((error) => {
          if (error) {
            actions.showError();
          }
        });
      }

      utils.statReachGoal('feature_buy_btn');
    }}
  />);

  utils.statReachGoal('feature_btn');
}

function featureBuy(isSale) {
  if (!window.isOK) {
    actions.loaderShow();
  }

  const productType = isSale ? 'feature_sale' : 'feature';

  if (window.isNative) {
    native.purchase('feature').then(() => {
      actions.loaderSuccess();
      activityActions.loadFeaturedUsers();
    }).catch(() => actions.showError());
  } else if (window.isOK) {
    window.okPayRequestType = 'feature';
    window.FAPI.UI.showPayment('Больше посетителей', '', 'feature', Prices.feature.rubles, null, null, 'ok', 'true');
  } else if (window.isDG) {
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
    }).catch((error) => {
      if (error) {
        actions.showError();
      }
    });
  }

  utils.statReachGoal('feature_buy_btn');
}

export function showWantToTalkBox() {
  const btnText = window.isDG ? `Получить за ${utils.gram(Prices.wantToTalk.votes, ['голос', 'голоса', 'голосов'])}` : `Получить за ${Prices.wantToTalk.rubles}₽`;
  const buttonCaption = window.isDG ? null : <div className="VKPay_info">Безопасный платеж через <div className="VKPay_icon" /></div>;
  actions.setPopout(<NotificationsPermission
    title="Больше сообщений"
    caption="Пусть все знают, что Вы онлайн и хотите общаться!"
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
        }).catch((error) => {
          if (error) {
            actions.showError();
          }
        });
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

window.API_callback = (method, result, data) => {
  console.log('API_callback', method, result, data);

  if (method === 'showPayment') {
    if (result === 'ok') {
      actions.loaderSuccess();
      if (window.okPayRequestType === 'feature') {
        activityActions.loadFeaturedUsers();
      } else if (window.okPayRequestType === 'premium') {
        setPremiumState(true);
      }
    } else {
    }
  }
};

export function hasPromo() {
  const { promoBits } = store.getState();

  return !(promoBits & PromoBits.story);
}

let promoteFeatureIndex = 0;
export function promoteFeature() {
  const featuresKeys = Object.keys(features());
  if (!featuresKeys.length) {
    return false;
  }
  const feature = featuresKeys[promoteFeatureIndex % featuresKeys.length];
  promoteFeatureIndex++;
  return features()[feature];
}

export function features() {
  let ret = {
    feature: {
      caption: 'Поднимитесь на первое место, и Вас заметит больше девушек.',
      button: 'Подняться на 1-е место',
      onClick: () => showFeatureBox()
    },
    wantToTalk: {
      caption: 'Расскажите всем, что Вы онлайн и хотите общаться.',
      button: 'Рассказать',
      onClick: () => showWantToTalkBox()
    }
  };

  if (!hasPremium) {
    ret.premium = {
      caption: 'Посещайте профили инкогнито с Знакомства «Премиум»',
      button: 'Получить «Премиум»',
      onClick: () => showSubscriptionRequest('promote')
    };
  }

  return ret;
}
