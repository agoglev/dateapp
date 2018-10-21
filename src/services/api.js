import store from '../store';
import connect from '@vkontakte/vkui-connect';
import * as utils from '../utils';
//import connect from '@vkontakte/vkui-connect-mock';

const API_ENTRY = 'https://dev.kphp.net/api.php';


export function method(name, params = {}) {
  params.token = store.getState().token;
  params.method = name;
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
        } else {
          resolve(json.response);

          if (name !== methods.setOnline) {
            updateOnline();
          }
        }
      }).catch(() => reject({http: true}));
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

  method(methods.setOnline).catch(() => console.log('wrong set offline call'));
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
  clearHistory: 'clear_history'
};

let vkRequestId = 0;
let vkRequestCallbacks = {};
export function vk(method, params = {}) {
  return new Promise((resolve, reject) => {
    const reqId = ++vkRequestId;

    vkRequestCallbacks[reqId] = {resolve, reject};

    params.access_token = store.getState().vkAccessToken;
    params.request_id = reqId;
    params.v = '5.85';
    connect.send('VKWebAppCallAPIMethod', {
      method,
      params,
      request_id: String(reqId)
    });
  });
}

export function handleMethodResult(requestId, response) {
  vkRequestCallbacks[requestId].resolve(response);
  delete vkRequestCallbacks[requestId];
}

export function handleMethodError(error) {
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