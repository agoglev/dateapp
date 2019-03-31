import store from '../store';
import * as actionTypes from '../actions/actionTypes';
import connect from '@vkontakte/vkui-connect';
import * as utils from '../utils';
import * as actions from '../actions';
import * as native from './native';

const API_ENTRY = 'https://dev.kphp.net/api.php';


export function method(name, params = {}) {
  params.token = store.getState().token;
  params.method = name;
  params.app_id = window.appId;
  return new Promise((resolve, reject) => {
    const form = new FormData();
    for (let k in params) {
      form.append(k, params[k]);
    }

    let apiEntry = utils.isDev() ? 'https://dev.kphp.net' : 'https://dateapp.ru';

    fetch(`${apiEntry}/api.php`, {
      method: 'POST',
      cache: 'no-cache',
      body: form
    })
      .then(response => response.json())
      .then(json => {
        if (json.error) {
          reject(json.error);

          if (json.error.code === 'works') {
            store.dispatch({type: actionTypes.WORKS});
          } else if (json.error.code === 'auth') {
            native.logout();
          }
        } else {
          resolve(json.response);

          if (name !== methods.setOnline) {
            updateOnline();
          }
        }
      }).catch((err) => reject({http: true, message: err.message}));
  });
}

let lastOnlineSetTime = 0;
function updateOnline() {
  if (!store.getState().token) {
    return;
  }

  let now = new Date().getTime();
  if (now - lastOnlineSetTime < 60 * 1000) {
    return;
  }

  method(methods.setOnline).then((user) => {
    actions.setUser(user);
  }).catch(() => console.log('wrong set offline call'));
  lastOnlineSetTime = now;
}

export const methods = {
  init: 'init',
  countries: 'countries',
  cities: 'cities',
  uploadPhoto: 'upload_photo',
  createAccount: 'create_account',
  cardsGet: 'cards_get',
  cardsSetReason: 'cards_set_reason',
  activity: 'activity',
  activityMore: 'activity_more',
  featuredUsers: 'featured_users',
  imHistory: 'im_history',
  sendMessage: 'send_message',
  imMarkAsSeen: 'im_mark_as_seen',
  sendPhotoMessage: 'send_photo_message',
  cardsReport: 'cards_report',
  likesAction: 'likes_action',
  edit: 'edit',
  saveFilters: 'save_filters',
  deleteAccount: 'delete_account',
  restoreAccount: 'restore_account',
  resetBadge: 'reset_badge',
  setOnline: 'set_online',
  clearHistory: 'clear_history',
  jsError: 'js_error',
  clearSeenCards: 'clear_seen_cards',
  ads: 'ads',
  adsSeen: 'ads_seen',
  getLikes: 'get_likes',
  readLike: 'read_like',
  payParams: 'pay_params',
  liveChatsGet: 'live_chat_get',
  liveChatsReason: 'live_chats_reason',
  liveChatsLeave: 'live_chats_leave',
  liveChatsMessage: 'live_chats_message',
  liveChatsLike: 'live_chats_like',
  liveChatsSeen: 'live_chats_seen',
  search: 'search',
  save_search_filters: 'save_search_filters',
  ban: 'ban',
  unBan: 'unban',
  profileView: 'profile_view',
  stats: 'stats',
  reports: 'reports',
  skipReport: 'skip_report',
  banReport: 'ban_report',
  restoreReport: 'restore_report',
  notify: 'notify',
  notifySave: 'notify_save',
  guests: 'guests',
  premium: 'premium',
  premiumSave: 'premium_save',
  toggleFav: 'toggle_fav',
  favorites: 'favorites',
  saveGeo: 'save_geo',
  imNotifyEnable: 'im_notify_enable',
  rates: 'rates',
  invites: 'invites',
  invitesBuyProduct: 'invites_buy_product',
  moderStats: 'moder_stats',
  nativePurchase: 'native_purchase'
};

let vkRequestId = 0;
let vkRequestCallbacks = {};
export function vk(method, params = {}) {
  return new Promise((resolve, reject) => {
    if (window.isDG) {
      if (!window.VK || !window.VK.api) {
        return reject();
      }
      window.VK.api(method, params, (resp) => {
        if (resp.response) {
          resolve(resp.response);
        } else {
          reject(resp.error);
        }
      });
    } else {
      requestAccessToken().then((accessToken) => {
        const reqId = ++vkRequestId;

        vkRequestCallbacks[reqId] = {resolve, reject};

        params.access_token = accessToken;
        params.request_id = reqId;
        params.v = '5.85';
        connect.send('VKWebAppCallAPIMethod', {
          method,
          params,
          request_id: String(reqId)
        });
      }).catch(() => {
        reject({access_token: true});
      });
    }
  });
}

export function handleMethodResult(requestId, response) {
  if (vkRequestCallbacks[requestId]) {
    vkRequestCallbacks[requestId].resolve(response);
    delete vkRequestCallbacks[requestId];
  }
}

export function handleMethodError(error) {
  if (error.request_params) {
    let requestId = false;
    for (let i = 0; i < error.request_params.length; i++) {
      const param = error.request_params[i];
      if (param.key === 'request_id') {
        requestId = parseInt(param.value, 10);
      }
    }
    vkRequestCallbacks[requestId].reject();
    delete vkRequestCallbacks[requestId];
  }
}

let _orderBoxPromise = false;
export function showOrderBox(item) {
  return new Promise((resolve, reject) => {
    const { VK } = window;

    VK.addCallback('onOrderBoxDone', _orderBoxCallback);
    VK.addCallback('onOrderSuccess', _onOrderSuccess);
    VK.addCallback('onOrderCancel', _onOrderCancel);
    VK.addCallback('onOrderFail', _onOrderFail);
    _orderBoxPromise = {resolve, reject};
    VK.callMethod('showOrderBox', {type: 'item', item});
  });
}

function _onOrderSuccess() {
  removeOrderCallbacks();
  if (!_orderBoxPromise) {
    return;
  }
  _orderBoxPromise.resolve();
  _orderBoxPromise = false;
}

function _onOrderCancel() {
  removeOrderCallbacks();
  if (!_orderBoxPromise) {
    return;
  }
  _orderBoxPromise.reject();
  _orderBoxPromise = false;
}

function _onOrderFail() {
  removeOrderCallbacks();
  if (!_orderBoxPromise) {
    return;
  }
  _orderBoxPromise.reject(true);
  _orderBoxPromise = false;
}

function removeOrderCallbacks() {
  const { VK } = window;
  VK.removeCallback('onOrderBoxDone', _orderBoxCallback);
  VK.removeCallback('onOrderSuccess', _onOrderSuccess);
  VK.removeCallback('onOrderCancel', _onOrderCancel);
  VK.removeCallback('onOrderFail', _onOrderFail);
}

function _orderBoxCallback(status) {
  removeOrderCallbacks();

  if (!_orderBoxPromise) {
    return;
  }

  if (status === 'success') {
    _orderBoxPromise.resolve();
  } else {
    _orderBoxPromise.reject(status === 'fail');
  }
  _orderBoxPromise = false;
}

let accessTokenPromise = false;
export function requestAccessToken() {
  return new Promise((resolve, reject) => {
    const state = store.getState();
    if (state.vkAccessToken) {
      return resolve(state.vkAccessToken);
    }
    accessTokenPromise = {resolve, reject};
    connect.send('VKWebAppGetAuthToken', {app_id: 6682509, scope: ''});
  });
}

export function hadnleAccessTokenEventSuccess(token) {
  if (accessTokenPromise) {
    accessTokenPromise.resolve(token);
    store.dispatch({type: actionTypes.SET_VK_ACCESS_TOKEN, token});
    accessTokenPromise = false;
  }
}

export function hadnleAccessTokenEventFailed() {
  if (accessTokenPromise) {
    accessTokenPromise.reject();
    accessTokenPromise = false;
  }
}
