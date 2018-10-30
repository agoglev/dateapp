//import 'core-js/es6/map';
//import 'core-js/es6/set';
import 'core-js/es6';
import 'url-search-params-polyfill';
import * as Sentry from '@sentry/browser';

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

if (!utils.isDev()) {
  Sentry.init({
    dsn: "https://fae54b9a6d73455c846c9b989a6d9373@sentry.io/1306576"
  });
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

if (utils.isDev() && utils.isInspectOpen()) {
  accountActions.init('test');
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