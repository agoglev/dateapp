import 'core-js/es6';
import 'url-search-params-polyfill';

import React from 'react';
import ReactDOM from 'react-dom';
import connect from '@vkontakte/vkui-connect';
import App from './App';
import registerServiceWorker from './sw';
import store from './store';
import router  from './router';
import { Provider } from 'react-redux';
import * as actionTypes from './actions/actionTypes';
import VkConnect from "@vkontakte/vkui-connect/index";
import * as actions from './actions';
import * as accountActions from './actions/account';
import * as utils from './utils';
import * as api from './services/api';
import Cards from './containers/Main/Cards';
import Proxy from './services/proxy_sdk/proxy';

const url = window.location.href;
if (url.indexOf('vk_') > -1) {
  window.initialUrl = url;
}
const queryStr = window.location.search;
window.queryStr = queryStr;
window.path = window.location.pathname;
const urlParams = new URLSearchParams(window.location.search);
const hashParams = new URLSearchParams(String(window.location.hash).substr(1));
if (hashParams.get('ref')) {
  window.refId = hashParams.get('ref');
}

window.vkPlatform = urlParams.get('vk_platform');
if (urlParams.get('vk_platform') === 'web2' || urlParams.get('vk_platform') === 'desktop_web' || urlParams.get('platform') === 'web') {
  window.isDesktop = true;
  document.body.classList.add('desktop');
}

const urlToken = urlParams.get('access_token');
const urlSign = urlParams.get('sign');
window.urlToken = urlToken;
window.appId = parseInt(urlParams.get('api_id'), 10);
const isNeedFeature = window.location.hash.indexOf('feature') > -1;

if (isNeedFeature) {
  actions.setNeedFeatureBoxState(true);
}

if (window.location.hash.indexOf('notify') > -1 || isNeedFeature) {
  accountActions.setDefaultTab('messages');
}

window.onerror = function handler(msg, file, line, col, err) {
  api.method(api.methods.jsError, {
    stack: err.message + "\n" + err.stack,
    device: window.navigator.userAgent,
    url: window.location.href
  });
};

if (!urlToken) {
  Proxy.init('vk_apps');
}

// Service Worker For Cache
//registerServiceWorker();

router.addListener((to, from) => store.dispatch({ type: actionTypes.NAVIGATE, to, from })).start();

VkConnect.subscribe((e) => {
  const data = e.detail.data;
  switch (e.detail.type) {
    case 'VKWebAppGetClientVersionResult':
      actions.setVersion(data.platform, data.version);
      connect.send('VKWebAppGetUserInfo', {});
      if (!window.isDesktop) {
        connect.send('VKWebAppGetAuthToken', {app_id: 6682509, scope: ''});
      }
      break;
    case 'VKWebAppAccessTokenReceived':
      if (!window.isDesktop) {
        accountActions.init(data.access_token);
      }
      api.hadnleAccessTokenEventSuccess(data.access_token);
      break;
    case 'VKWebAppAccessTokenFailed':
      api.hadnleAccessTokenEventFailed();
      //store.dispatch({type: actionTypes.VK_FAILED});
      break;
    case 'VKWebAppGetUserInfoResult':
      accountActions.setupVkInfo(data);
      if (utils.canAuthWithSig()) {
        //setTimeout(accountActions.init(), 10);
      }
      break;
    case 'VKWebAppGetUserInfoFailed':
      store.dispatch({type: actionTypes.VK_FAILED});
      break;
    case 'VKWebAppCallAPIMethodResult':
      api.handleMethodResult(parseInt(data.request_id, 10), data.response);
      break;
    case 'VKWebAppCallAPIMethodFailed':
      api.handleMethodError(data.error_data);
      break;
    case 'VKWebAppOpenPayFormResult':
      const result = data.result ? data.result : data;
      actions.resolveVkPayRequest(result.status);
      break;
    case 'VKWebAppOpenPayFormFailed':
      actions.resolveVkPayRequest(false);
      break;
    case 'VKWebAppGeodataResult':
      accountActions.saveGeo(data);
      break;
    case 'VKWebAppGeodataFailed':
      accountActions.geoFailed();
      break;
    case 'VKWebAppUpdateConfig':
      document.body.setAttribute('scheme', data.scheme);
      break;
    default:
      console.log(e.detail.type);
  }
});
connect.send("VKWebAppGetClientVersion", {});

function render() {
  ReactDOM.render(
    <Provider store={store}>
      <App store={store} router={router} />
    </Provider>,
    document.getElementById('root')
  );
}

// for debug
if (utils.isDev() && utils.isInspectOpen()) {
  window._DEBUG_TOKEN = localStorage.getItem('_token');
  accountActions.init(window._DEBUG_TOKEN);
}

window.adsEmpty = () => {
  store.dispatch({type: actionTypes.ADS_UPDATE, shown: false});
};

if (urlToken) {
  window.isDG = true;
  accountActions.init(urlToken);

  let scope = 0;
  if (urlParams && urlParams.get) {
    scope = parseInt(urlParams.get('api_settings'), 10);
  }

  window.isDGNotifiEnabled = scope & 1 === 1;
  window.isDGMessagesBlocked = parseInt(urlParams.get('is_messages_blocked'), 10);
} else if (urlSign && window.isDesktop) {
  accountActions.init();
}

if (window.isDG) {
  window.onload = () => {
    window.VK.init(function () {
      Proxy.init('direct_games');
    }, function () {
      document.body.innerHTML = 'Ошибка';
    }, '5.87', queryStr);
    render();
  };
} else {
  render();
}

window.onresize = () => {
  Cards.shared && Cards.shared._updateHeight();
};

utils.updateVkFrameHeight();
