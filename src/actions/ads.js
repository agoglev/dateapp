import * as utils from '../utils';
import * as api from '../services/api';
import store from '../store';
import * as actionTypes from './actionTypes';
import * as payments from './payments';

export function load() {
  api.method(api.methods.ads, {
    app_id: window.appId,
    version: 3,
  }).then((ads) => {
    if (ads.length > 0) {
      utils.statReachGoal('ads_got');
    }

    store.dispatch({ type: actionTypes.SET_ADS, ads });

  }).catch((err) => console.log('ads loading error', err.message));
}

const cardsAdsSeen = {};
export function getUnseenAd() {
  const ads = store.getState().ads;
  for (let ad of ads) {
    if (!ad.is_seen && !cardsAdsSeen[ad.id]) {
      return ad;
    }
  }

  return false;
}

export function cardsMarkAsSeen(id) {
  cardsAdsSeen[id] = true;
}

let adIndex = 0;
export function getAd() {
  const ads = store.getState().ads;
  if (!ads.length) {
    return payments.promoteFeature();
  }
  const ad = ads[adIndex % ads.length];
  adIndex++;

  return {
    type: 'ad',
    caption: ad.title,
    ...ad,
    onClick: () => sendClick(ad.id),
  };
}

let seenIds = {};
export function sendSeen(id) {
  if (seenIds[id]) {
    return;
  }
  seenIds[id] = 1;

  api.method(api.methods.adsSeen, {
    ad_id: id,
    click: 0,
  }).catch(() =>{
    delete seenIds[id];
  });

  utils.statReachGoal('ads_seen');
}

export function sendClick(id) {
  if (seenIds[id] === 2) {
    return;
  }
  seenIds[id] = 2;

  api.method(api.methods.adsSeen, {
    ad_id: id,
    click: 1,
  }).catch(() =>{
    delete seenIds[id];
  });

  utils.statReachGoal('ads_click');
}