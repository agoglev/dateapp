import * as actionTypes from './actionTypes';
import store from '../store';
import * as actions from './index';
import * as cardsActions from './cards';
import * as api from '../services/api';
import * as utils from '../utils';
import * as pages from '../constants/pages';
import realTimeInit from '../services/realtime';

export let JoinInfo = {};
let defaultTab = 'cards';

export function init(token = false) {
  const { vkUserInfo } = store.getState();
  if (token) {
    store.dispatch({type: actionTypes.SET_VK_ACCESS_TOKEN, token});
  }
  api.method(api.methods.init, {
    vk_id: vkUserInfo.id,
    vk_sig: vkUserInfo.signed_user_id || '',
    vk_token: token || '',
    is_dg: window.isDG ? 1 : 0
  })
    .then(initMethodHandler)
    .catch(() => {
    store.dispatch({
      type: actionTypes.APP_INITED,
      needJoin: true
    });
    actions.setTab('error');
  });
}

export function setupVkInfo(info) {
  store.dispatch({
    type: actionTypes.SETUP_VK_USER_INFO,
    info: info
  });
}

let Countries = false;
export function loadCountries() {
  return new Promise((resolve, reject) => {
    if (Countries) {
      resolve(Countries);
    } else {
      api.method('countries')
        .then((resp) => {
          resolve(resp);
          Countries = resp;
        })
        .catch(reject);
    }
  });
}

let Cities = {};
export function loadCities(countryId, q, fast = false) {
  return new Promise((resolve, reject) => {
    if (Cities[q]) {
      resolve([Cities[q], q]);
    } else {
      utils.throttle('search_city', () => {
        api.method('cities', {
          country_id: countryId,
          q
        }).then((resp) => {
          resolve([resp, q]);
          Cities[q] = resp;
        }).catch(reject);
      }, fast ? 0 : 1000);
    }
  });
}

export function fillJoinInfo(info) {
  JoinInfo = Object.assign({}, JoinInfo, info);
}

export function createAccount(photos) {
  actions.loaderShow();
  return new Promise((resolve, reject) => {
    const { vkUserInfo } = store.getState();
    api
      .method(api.methods.createAccount, {
        vk_token: store.getState().vkAccessToken,
        vk_id: vkUserInfo.id,
        vk_sig: vkUserInfo.signed_user_id || '',
        photos: photos.join(','),
        is_dg: window.isDG ? 1 : 0,
        ...JoinInfo
      })
      .then((resp) => {
        actions.loaderSuccess();
        initMethodHandler(resp);
        resolve();
      })
      .catch(() => {
        actions.loaderHide();
        reject()
      });
  });
}

function initMethodHandler(resp) {
  store.dispatch({
    type: actionTypes.APP_INITED,
    needJoin: !!resp.need_join,
    token: resp.token,
    userId: resp.user ? resp.user.id : 0,
    gifts: resp.gifts,
    hasBadge: resp.hasBadge
  });
  if (resp.need_join) {
    actions.setTab('join');
  } else {
    actions.setUser(resp.user);
    actions.setTab(defaultTab);
    realTimeInit();
    cardsActions.initTips();
    utils.statReachGoal('real_user');
    utils.statReachGoal(window.isDG ? 'real_user_dg' : 'real_user_vkapps');
    store.dispatch({type: actionTypes.SET_LIKES_BADGE, hasBadge: resp.hasLikesBadge});
  }
}

export function deleteAccount() {
  return new Promise((resolve, reject) => {
    api.method(api.methods.deleteAccount).then((user) => {
      actions.setUser(user);
      resolve();
    }).catch(reject);
  });
}

export function restoreAccount() {
  return new Promise((resolve, reject) => {
    api.method(api.methods.restoreAccount).then((user) => {
      actions.setUser(user);
      resolve();
    }).catch(reject);
  });
}

export function resetBadge() {
  if (store.getState().hasBadge) {
    api.method(api.methods.resetBadge);
  }
  store.dispatch({type: actionTypes.SET_BADGE, hasBadge: false});
}

export function showBadge() {
  const state = store.getState();
  if (state.activeTab !== 'messages' && state.activeView !== 'likes') {
    store.dispatch({type: actionTypes.SET_BADGE, hasBadge: true});
  }
}

export function setDefaultTab(tab) {
  defaultTab = tab;
}
