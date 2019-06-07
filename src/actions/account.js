import * as actionTypes from './actionTypes';
import store from '../store';
import * as actions from './index';
import * as cardsActions from './cards';
import * as api from '../services/api';
import * as utils from '../utils';
import * as pages from '../constants/pages';
import realTimeInit from '../services/realtime';
import * as payments from './payments';
import * as searchActions from './search';
import proxy from "../services/proxy_sdk/proxy";
import * as native from '../services/native';

export let JoinInfo = {};
export let searchFilters = {};
let defaultTab = 'cards';

export function init(token = false) {
  const { vkUserInfo } = store.getState();
  if (token) {
    store.dispatch({type: actionTypes.SET_VK_ACCESS_TOKEN, token});
  }
  let query = {
    vk_id: vkUserInfo.id,
    vk_sig: vkUserInfo.signed_user_id || '',
    vk_token: token || '',
    is_dg: window.isDG ? 1 : 0,
    vk_url: window.initialUrl,
    is_ios: utils.isIOS() ? 1 : 0,
    app_token: window.appToken
  };

  if (window.okSession) {
    query.ok_session = window.okSession;
    query.ok_secret = window.okSecretSession;
  }

  api.method(api.methods.init, query)
    .then(initMethodHandler)
    .catch((err) => {
      console.log('ERROR', err.message, err);
      store.dispatch({
        type: actionTypes.APP_INITED,
        needJoin: true
      });
      actions.setTab('error');
      native.logout();
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

    let query = {
      vk_token: store.getState().vkAccessToken,
      vk_id: vkUserInfo.id,
      vk_sig: vkUserInfo.signed_user_id || '',
      photos: photos.join(','),
      is_dg: window.isDG ? 1 : 0,
      vk_url: window.initialUrl,
      is_ios: utils.isIOS() ? 1 : 0,
      ref_id: window.refId,
      group_id: window.GroupId,
      app_token: window.appToken,
      tmp_token: window.tmpToken,
      ...JoinInfo
    };
    if (window.adsCompany) {
      query.ads_company = window.adsCompany;
    }

    if (window.okSession) {
      query.ok_session = window.okSession;
      query.ok_secret = window.okSecretSession;
    }

    api
      .method(api.methods.createAccount, query)
      .then((resp) => {
        actions.loaderSuccess();
        initMethodHandler(resp);
        resolve();
        utils.statReachGoal('register');
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
    hasBadge: resp.hasBadge,
    hasPremium: resp.hasPremium,
    isModer: resp.isModer || false,
    isImNotifyEnabled: resp.isImNotifyEnabled,
    isNeedShowFeatureSuggestion: !!resp.isNeedShowFeatureSuggestion,
    promo_bits: resp.promo_bits,
    stickers: resp.stickers,
    stickersMask: resp.stickers_mask
  });
  if (resp.need_join) {
    window.tmpToken = resp.tmp_token || '';
    actions.setTab('join');
  } else {
    actions.setUser(resp.user);
    actions.setTab(defaultTab);
    realTimeInit();
    cardsActions.initTips();
    utils.statReachGoal('real_user');
    utils.statReachGoal(window.isDG ? 'real_user_dg' : 'real_user_vkapps');
    payments.setPremiumState(resp.hasPremium);
    searchFilters = resp.searchFilters;

    if (resp.payments_rates) {
      payments.setPrices(resp.payments_rates);
    }

    if (resp.loc && !resp.user.deactivated) {
      proxy.getGeodata().then((location) => {
        if (utils.distance(parseInt(location.lat, 10), parseInt(location.long, 10), resp.loc.lat, resp.loc.long, 'K') >= 2) {
          cardsActions.loadCards(true);
        }
      }).catch(() => console.log('getGeodata failed'));
    }

    const chatId = parseInt(window.hashParams.get('chat_id'), 10) || 0;
    if (chatId > 0) {
      actions.openChat(chatId);
    }

    native.saveToken(resp.token);
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

export function saveSearchFilters(gender, sort, ageFrom, ageTo) {
  return new Promise((resolve, reject) => {
    api.method(api.methods.save_search_filters, {
      gender,
      sort,
      age_from: ageFrom,
      age_to: ageTo
    }).then(() => {
      searchFilters = {
        ...searchFilters,
        gender,
        sort,
        age: {
          from: ageFrom,
          to: ageTo
        }
      };
      resolve();
    }).catch(reject)
  });
}

export function loadStats() {
  actions.setData('isFailed', false, pages.STATS);
  actions.setData('isLoading', true, pages.STATS);
  api.method(api.methods.stats).then(({stats, level}) => {
    actions.setDataMulti({
      stats,
      level,
      isLoading: false
    }, pages.STATS);
  }).catch(() => {
    actions.setDataMulti({
      isLoading: false,
      isFailed: true
    }, pages.STATS);
  });
}

export function loadNotifySettings() {
  actions.setData('isLoading', true, pages.NOTIFY);
  actions.setData('isFailed', false, pages.NOTIFY);
  api.method(api.methods.notify).then((settings) => {
    actions.setData('settings', settings, pages.NOTIFY);
    actions.setData('isLoading', false, pages.NOTIFY);
  }).catch(() => {
    actions.setData('isLoading', false, pages.NOTIFY);
    actions.setData('isFailed', true, pages.NOTIFY);
  });
}

export function saveNotifySettings() {
  actions.loaderShow();
  const { settings } = actions.getData(pages.NOTIFY);
  api.method(api.methods.notifySave, {
    message: settings.message ? 1 : 0,
    match: settings.match ? 1 : 0,
    like: settings.like ? 1 : 0,
    gift: settings.gift ? 1 : 0,
    guest: settings.guest ? 1 : 0,
  }).then(() => {
    actions.loaderSuccess();
    window.history.back();
  }).catch(() => actions.showError())
}

export function loadFullProfile(profileId) {
  actions.setData({
    isLoading: true,
    isFailed: false
  }, pages.PROFILE);
  api.method(api.methods.profileView, {
    user_id: profileId
  }).then((info) => {
    actions.setData({
      isLoading: false,
      isLiked: info.is_liked,
      isFavorite: info.is_favorite,
      extra: info.extra
    }, pages.PROFILE);
  }).catch(() => {
    actions.setData({
      isLoading: false,
      isFailed: true
    }, pages.PROFILE);
  });
}

export function saveGeo(data) {
  if (!data.available) {
    return;
  }

  actions.setData({isGeoNotifyShown: false}, pages.SEARCH);
  api.method(api.methods.saveGeo, {
    lat: parseInt(data.lat, 10),
    long: parseInt(data.long, 10),
  }).then(() => {
    const data = actions.getData(pages.SEARCH);
    if (data.users) {
      searchActions.load(true);
    }
  });
}

export function geoFailed() {
  actions.setData({isGeoNotifyShown: true}, pages.SEARCH);
}

export function imNotifyEnable() {
  actions.hideImNotifyRequest();
  api.method(api.methods.imNotifyEnable);
}

export function loadInvites() {
  actions.setDataMulti({isLoading: true, isFailed: false}, pages.INVITES);
  api.method(api.methods.invites)
    .then((resp) => actions.setDataMulti({...resp}, pages.INVITES))
    .catch(() => actions.setData('isFailed', true, pages.INVITES))
    .then(() => actions.setData('isLoading', false, pages.INVITES));
}

export function invitesBuyProduct(type) {
  return new Promise((resolve, reject) => {
    api.method(api.methods.invitesBuyProduct, {
      type
    }).then((resp) => {
      actions.setDataMulti({...resp}, pages.INVITES);
      resolve();
    }).catch((err) => reject(err));
  });
}

export function openSticker(sticker) {
  const mask = store.getState().stickersMask;
  if (!(mask & sticker)) {
    store.dispatch({type: actionTypes.SET_STICKERS_MASK, mask: mask + sticker});
  }

  api.method(api.methods.openSticker, {
    sticker
  });
}
