import * as actionTypes from './actionTypes';
import store from '../store';
import * as actions from './index'
import * as api from '../services/api';
import * as utils from '../utils';
import * as pages from '../constants/pages';

export let dislikeTipShown = true;
export let likeTipShown = true;
export let matchTipShown = true;
let sortTipShown = true;
let needShowSortTip = false;

let SystemCardsQueue = [];

export function loadCards() {
  return new Promise((resolve, reject) => {
    let cards = store.getState().cards;
    if (cards.length > 0) {
      return resolve();
    }
    api.method(api.methods.cardsGet, {})
      .then((cards) => {
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
          loadAds();
        }
      }).catch(() => {
        reject();
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

        const cards = store.getState().cards;
        if (cards.length && cards[0].is_ad) {
          utils.statReachGoal('ads_view');
        }
        if (store.getState().cards.length < 5) {
          preloadCards();
        }
      })
      .catch(() => reject(card));

    if (!isLike) {
      addCardToDisliked(card);
    }
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
    keys: 'cards_liked,cards_disliked,cards_match,cards_tip_sort'
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

    /*let cards = store.getState().cards;
    if (!sortTipShown) {
      if (!cards.length) {
        needShowSortTip = true;
      } else if (cards.length > 10) {
        SystemCardsQueue.push(getSortTip());
        fillSystemCards();
      }
    }*/
  });
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
export function loadAds() {
  adsLoaded = true;
  if (window.isDG) {
    return;
  }
  api.method(api.methods.ads).then((ads) => {
    if (ads.length > 0) {
      utils.statReachGoal('ads_got');
    }

    for (let i = 0; i < ads.length; i++) {
      SystemCardsQueue.push(ads[i]);
    }
    fillSystemCards();
  });
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
    if (count === 5) {
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

let adsMarkedAsSeen = {};
export function markAdAsSeen(id, isClick) {
  if (adsMarkedAsSeen[id] && !isClick) {
    return;
  }
  adsMarkedAsSeen[id] = true;
  api.method(api.methods.adsSeen, {
    ad_id: id,
    click: isClick ? 1 : 0
  });
  if (isClick) {
    let cards = store.getState().cards;
    if (cards.length > 0 && cards[0].is_ad) {
      setTimeout(() => shiftCard(), 1000);
    }
  }

  utils.statReachGoal(isClick ? 'ads_click' : 'ads_skip');
}
