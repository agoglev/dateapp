import React from 'react';
import * as actionTypes from './actionTypes';
import store from '../store';
import * as actions from './index'
import * as api from '../services/api';
import * as utils from '../utils';
import {showNotification} from "./push";
import * as adsActions from "./ads";

export let dislikeTipShown = true;
export let likeTipShown = true;
export let matchTipShown = true;
export let swipeTipShown = true;
let sortTipShown = true;
let needShowSortTip = false;

let SystemCardsQueue = [];
export let cancelledCards = {};
let isAdsLocked = false;

let list = null;
export function getCurrentList() {
  if (list === null) {
    list = window.GroupId > 0 ? 'community' : 'all';
  }
  return list;
}

export function setCurrentList(newList) {
  list = newList;
}

export function loadCards(force = false) {
  return new Promise((resolve, reject) => {
    let cards = store.getState().cards;
    if (cards.length > 0 && !force) {
      return resolve();
    }
    api.method(api.methods.cardsGet, {
      list: getCurrentList(),
      group_id: window.GroupId
    })
      .then((cards) => {
        actions.setUsers(cards);
        store.dispatch({type: actionTypes.CARDS_SET, cards});
        resolve();

        if (needShowSortTip && cards.length > 10) {
          setTimeout(() => {
            SystemCardsQueue.push(getSortTip());
            fillSystemCards();
            needShowSortTip = false;
          }, 100);
        }

        if (!adsLoaded) {
          adsRotate();
        }

        if (cards.length > 0 && !window.cardsSwipeRightTipShown) {
          window.cardsSwipeRightTipShown = true;
          showNotification('swipe_right', 'Сделайте 50 свайпов вправо, чтобы найти пару!', '', {
            timeout: 3000
          });
        }

      }).catch((err) => {
        reject(err);
    });
  })
}

let _preloading = false;
function preloadCards() {
  if (_preloading) {
    return;
  }
  _preloading = true;

  let cards = store.getState().cards;
  let notIds = [];
  for (let i = 0; i < cards.length; i++) {
    notIds.push(cards[i].id);
  }

  api.method(api.methods.cardsGet, {
    not_ids: notIds.join(',')
  })
    .then((cards) => {
      let curCards = store.getState().cards;
      let cardsIds = {};
      for (let i = 0; i < curCards.length; i++) {
        cardsIds[curCards[i].id] = true;
      }

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        if (!cardsIds[card.id]) {
          curCards.push(card);
        }
      }

      store.dispatch({type: actionTypes.CARDS_SET, cards: curCards});
      _preloading = false;
    }).catch(() => _preloading = false);
}

function shiftCard() {
  let cards = store.getState().cards;
  const card = cards.shift();
  store.dispatch({type: actionTypes.CARDS_SET, cards});
  return card;
}

function removeCardById(userId) {
  let cards = store.getState().cards;
  for (let i = 0; i < cards.length; i++) {
    if (cards[i].id === userId) {
      cards.splice(i, 1);
      store.dispatch({type: actionTypes.CARDS_SET, cards});
      break;
    }
  }
}

export function prependCard(card) {
  let cards = store.getState().cards;
  cards.unshift(card);
  store.dispatch({type: actionTypes.CARDS_SET, cards});
}

export function setReason(isLike) {
  return new Promise((resolve, reject) => {
    const card = shiftCard();
    api.method(api.methods.cardsSetReason, {
        reason: isLike ? 1 : 0,
        to_id: card.id
      })
      .then(() => {
        resolve();

        if (!isLike) {
          addCardToDisliked(card);
        }

        if (isLike && card.is_like) {
          showMatchBox(card);
        }

        const cards = store.getState().cards;
        if (cards.length && cards[0].is_ad) {
          utils.statReachGoal('ads_view');
        }
        if (store.getState().cards.length < 5) {
          preloadCards();
        }
      })
      .catch(() => reject(card));

    adsRotate();
  });
}

export function report(userId) {
  return new Promise((resolve, reject) => {
    api.method(api.methods.cardsReport, {
      user_id: userId
    })
      .then(() => {
        removeCardById(userId);
        resolve();
      })
      .catch(reject);
  });
}

export function clear() {
  store.dispatch({type: actionTypes.CARDS_SET, cards: []});
}

let skipRequestNotificationsAccess = false;
export function requestNotificationsAccess() {
  if (skipRequestNotificationsAccess) {
    return;
  }
  skipRequestNotificationsAccess = true;

  if (window.isDG) {
    if (!window.isDGNotifiEnabled) {
      actions.requestMessagesPermissions();
    }
  } else {
    api.vk('apps.isNotificationsAllowed').then((resp) => {
      if (!resp.is_allowed) {
        actions.requestMessagesPermissions();
      }
    });
  }
}

function addCardToDisliked(card) {
  let dislikedCards = store.getState().dislikedCards;
  dislikedCards.push(card);
  store.dispatch({type: actionTypes.CARDS_DISLIKED_SET, dislikedCards});
}

export function getLastDislikedCard() {
  let dislikedCards = store.getState().dislikedCards;
  let card = dislikedCards.pop();
  store.dispatch({type: actionTypes.CARDS_DISLIKED_SET, dislikedCards});
  return card;
}

export function clearSeenCards() {
  return new Promise((resolve, reject) => {
    let cards = store.getState().cards;
    if (cards.length > 0) {
      return resolve();
    }
    api.method(api.methods.clearSeenCards, {})
      .then((cards) => {
        store.dispatch({type: actionTypes.CARDS_SET, cards});
        resolve();
      }).catch(() => {
      reject();
    });
  })
}

export function initTips() {
  api.vk('storage.get', {
    keys: 'cards_liked,cards_disliked,cards_match,cards_tip_sort,cards_tip_swipe'
  }).then((keysRaw) => {
    let keys = {};
    for (let i = 0; i < keysRaw.length; i++) {
      const item = keysRaw[i];
      keys[item.key] = parseInt(item.value, 10) || 0;
    }

    dislikeTipShown = keys.cards_disliked === 1;
    likeTipShown = keys.cards_liked === 1;
    matchTipShown = keys.cards_match === 1;
    sortTipShown = keys.cards_tip_sort === 1;
    swipeTipShown = keys.cards_tip_swipe === 1;

    /*let cards = store.getState().cards;
    if (!sortTipShown) {
      if (!cards.length) {
        needShowSortTip = true;
      } else if (cards.length > 10) {
        SystemCardsQueue.push(getSortTip());
        fillSystemCards();
      }
    }*/
  }).catch(() => console.log('initTips failed'));
}

function getSortTip() {
  return {
    system: true,
    type: 'sort',
    title: 'Подсказка',
    caption: 'Открывайте приложение каждый день, чтобы появляться чаще у других пользователей.'
  };
}

export function resolveLikeTip() {
  likeTipShown = true;
  api.vk('storage.set', {
    key: 'cards_liked',
    value: '1'
  });
}

export function resolveDisLikeTip() {
  dislikeTipShown = true;
  api.vk('storage.set', {
    key: 'cards_disliked',
    value: '1'
  });
}

export function resolveMatchTip() {
  matchTipShown = true;
  api.vk('storage.set', {
    key: 'cards_match',
    value: '1'
  });
}

export function resolveSystemCard() {
  const card = shiftCard();
  if (card.is_ad) {
    markAdAsSeen(card.id, false);
  } else {
    api.vk('storage.set', {
      key: `cards_tip_${card.type}`,
      value: '1'
    });
    sortTipShown = true;
    needShowSortTip = false;
  }
}

let adsLoaded = false;
let adsRotateSwipeCount = 0;
export function adsRotate() {
  for (let item of SystemCardsQueue) {
    if (item.is_ad) {
      return;
    }
  }

  adsRotateSwipeCount++;

  if (adsRotateSwipeCount > 5) {
    adsRotateSwipeCount = 0;

    let ad = adsActions.getUnseenAd();
    if (ad) {
      ad.is_ad = true;
      SystemCardsQueue.push(ad);
      fillSystemCards();
    }
  }

  // const now = new Date().getTime();
  // if (isAdsLocked || now - adsRotateLastTs < 3600) {
  //   return;
  // }
  // isAdsLocked = true;
  // api.method(api.methods.ads, {
  //   app_id: window.appId
  // }).then((ads) => {
  //   if (ads.length > 0) {
  //     adsMarkedAsSeen = {};
  //     utils.statReachGoal('ads_got');
  //   } else {
  //     isAdsLocked = false;
  //   }
  //
  //   adsRotateLastTs = now;
  //   for (let i = 0; i < ads.length; i++) {
  //     SystemCardsQueue.push(ads[i]);
  //   }
  //   fillSystemCards();
  // }).catch(() => isAdsLocked = false);
}

function fillSystemCards() {
  if (!SystemCardsQueue.length) {
    return;
  }

  let cards = store.getState().cards;
  let newCards = Object.assign([], cards);
  let count = 0;
  let offset = 0;
  for (let i = 0; i < cards.length; i++) {
    if (cards[i].system) {
      count = 0;
    }
    if (count === 1) {
      count = 0;
      newCards.splice(i + offset, 0, SystemCardsQueue.shift());
      offset++;
    } else {
      count++;
    }

    if (!SystemCardsQueue.length) {
      break;
    }
  }
  if (offset > 0) {
    store.dispatch({type: actionTypes.CARDS_SET, cards: newCards});
  }
}

export function markAdAsSeen(id, isClick) {
  adsActions.cardsMarkAsSeen(id);
  if (isClick) {
    adsActions.sendClick(id);
  } else {
    adsActions.sendSeen(id);
  }
}

export function resolveSwipeTip() {
  swipeTipShown = true;
  api.vk('storage.set', {
    key: `cards_tip_swipe`,
    value: '1'
  });
}

function showMatchBox(from) {
  const state = store.getState();
  const me = state.usersInfo[state.userId];

  const caption = utils.genderText(from.gender, [
    <span>{from.name} лайкнул Вас,<br/>а Вы лайкнули его</span>,
    <span>{from.name} лайкнула Вас,<br/>а Вы лайкнули её</span>
  ]);

  actions.setPopout(<div className="match_box_wrap">
    <div className="match_box_info">
      <div className="match_box_title">Взаимный лайк!</div>
      <div className="match_box_cards">
        <div className="match_box_card from" style={{backgroundImage: `url(${from.small_photo})`}} />
        <div className="match_box_card me" style={{backgroundImage: `url(${me.small_photo})`}} />
      </div>
      <div className="match_box_caption">{caption}</div>
    </div>
    <div className="match_box_buttons">
      <div className="match_box_button white" onClick={() => {
        actions.setPopout();
        setTimeout(() => actions.openChat(from.id), 10);
      }}>Написать сообщение</div>
      <div className="match_box_close" onClick={() => actions.setPopout()} />
    </div>
    <div className="match_box_bg">
      <svg width="960" height="960" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient fx="50%" fy="50%" r="52.083%" id="a">
            <stop stopColor="#DE356D" offset="0%"/>
            <stop stopColor="#E63973" offset="100%"/>
          </radialGradient>
        </defs>
        <path
          d="M480 480L432 0h96l-48 480zm0 0L678.43 40.308l83.14 48L480 480zm0 0l391.692-281.57 48 83.14L480 480zm0 0l480-48v96l-480-48zm0 0l439.692 198.43-48 83.14L480 480zm0 0l281.57 391.692-83.14 48L480 480zm0 0l48 480h-96l48-480zm0 0L281.57 919.692l-83.14-48L480 480zm0 0L88.308 761.57l-48-83.14L480 480zm0 0L0 528v-96l480 48zm0 0L40.308 281.57l48-83.14L480 480zm0 0L198.43 88.308l83.14-48L480 480z"
          fill="url(#a)" fillRule="evenodd"/>
      </svg>
    </div>
  </div>);

  utils.statReachGoal('match');
}
