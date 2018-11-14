import 'core-js/es6';
import 'url-search-params-polyfill';

import React from 'react';
import ReactDOM from 'react-dom';
import connect from '@vkontakte/vkui-connect';
import App from './App';
import registerServiceWorker from './sw';
import store from './store';
import router from './router';
import { Provider } from 'react-redux';
import * as actionTypes from './actions/actionTypes';
import VkConnect from "@vkontakte/vkui-connect/index";
import * as actions from './actions';
import * as accountActions from './actions/account';
import * as utils from './utils';
import * as api from './services/api';
import Cards from './containers/Main/Cards';

const urlParams = new URLSearchParams(window.location.search);
const urlToken = urlParams.get('access_token');
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
    device: window.navigator.userAgent
  });
};

// Init VK App
connect.send('VKWebAppInit', {});

// Service Worker For Cache
registerServiceWorker();

router.addListener((to, from) => store.dispatch({ type: actionTypes.NAVIGATE, to, from })).start();

VkConnect.subscribe((e) => {
  const data = e.detail.data;
  switch (e.detail.type) {
    case 'VKWebAppGetClientVersionResult':
      actions.setVersion(data.platform, data.version);
      connect.send('VKWebAppGetUserInfo', {});
      if (!utils.canAuthWithSig()) {
        connect.send('VKWebAppGetAuthToken', {app_id: 6682509, scope: ''});
      }
      break;
    case 'VKWebAppAccessTokenReceived':
      accountActions.init(data.access_token);
      break;
    case 'VKWebAppAccessTokenFailed':
      store.dispatch({type: actionTypes.VK_FAILED});
      break;
    case 'VKWebAppGetUserInfoResult':
      accountActions.setupVkInfo(data);
      if (utils.canAuthWithSig()) {
        setTimeout(accountActions.init(), 10);
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
      actions.resolveVkPayRequest(data.result && data.result.status);
      break;
    case 'VKWebAppOpenPayFormFailed':
      actions.resolveVkPayRequest(false);
      break;
    default:
      console.log(e.detail.type);
  }
});
connect.send("VKWebAppGetClientVersion", {});

ReactDOM.render(
  <Provider store={store}>
    <App store={store} router={router} />
  </Provider>,
  document.getElementById('root')
);

// for debug
if (utils.isDev() && utils.isInspectOpen()) {
  const token = localStorage.getItem('_token') || '';
  window._DEBUG_TOKEN = token.length > 0 ? token : '45c6e7a93a42eba61774bf0a9f498c51f5f108272ecf7c630519905c3847e932794585ccd86fe0f859ca9';
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
}

window.onresize = () => {
  Cards.shared && Cards.shared._updateHeight();
};
