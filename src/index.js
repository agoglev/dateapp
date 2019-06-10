import 'core-js/es6';
import 'url-search-params-polyfill';

import React from 'react';
import ReactDOM from 'react-dom';
import connect from '@vkontakte/vkui-connect';
import App from './App';
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
import persistentParamsPlugin from 'router5-plugin-persistent-params';
import * as native from './services/native';

window.isNative = !!window.location.hash.match(/native/);
window.isOK = !window.isNative && !!window.location.href.match(/session_secret_key/);
window.isFromAdsLove = !!window.location.href.match(/ads_love/);
window.isPromoStory = !!window.location.href.match(/story/);

const url = window.location.href;
if (url.indexOf('vk_') > -1) {
  window.initialUrl = url;
}
const queryStr = window.location.search;
window.queryStr = queryStr;
window.locHash = window.location.hash;
window.path = window.location.pathname;
const urlParams = new URLSearchParams(window.location.search);
window.urlParams = urlParams;
const hashParams = new URLSearchParams(String(window.location.hash).substr(1));
if (hashParams.get('ref')) {
  window.refId = hashParams.get('ref');
}
window.hashParams = hashParams;
window.GroupId = parseInt(window.urlParams.get('vk_group_id'), 10);
window.adsCompany = hashParams.get('ads') || '';
if (window.isFromAdsLove) {
  window.adsCompany = 'app_guests';
}

if (window.isNative) {
  window.appToken = urlParams.get('app_token') || '';
} else {
  window.appToken = '';
}

window.vkPlatform = urlParams.get('vk_platform');
if (urlParams.get('vk_platform') === 'web2' || urlParams.get('vk_platform') === 'desktop_web' || urlParams.get('platform') === 'web'
  || (window.isOK && !urlParams.get('mob'))) {
  window.isDesktop = true;
  document.body.classList.add('desktop');
}

let persistentParams = {};
for(let pair of urlParams.entries()) {
  persistentParams[pair[0]] = pair[1];
}

router.usePlugin(persistentParamsPlugin(persistentParams));

const urlToken = urlParams.get('access_token');
const urlSign = urlParams.get('sign');
window.urlToken = urlToken;
window.appId = parseInt(urlParams.get('api_id'), 10) || false;
if (!window.appId) {
  window.appId = parseInt(urlParams.get('vk_app_id'), 10);
}
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

if (window.isOK) {
  //
} else if (!urlToken) {
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
      //if (!window.isDesktop) {

      //}
      break;
    case 'VKWebAppAccessTokenReceived':
      let scope = data.scope.split(',');
      let scopeMap = {};
      for (let i = 0; i < scope.length; i++) {
        scopeMap[scope[i].trim()] = true;
      }

      if (scopeMap.stories) {
        if (!accountActions.inited) {
          accountActions.init(data.access_token);
        }
        api.hadnleAccessTokenEventSuccess(data.access_token);
      } else {
        api.hadnleAccessTokenEventFailed(e.detail);
        if (!accountActions.inited) {
          store.dispatch({type: actionTypes.VK_FAILED});
        }
      }
      break;
    case 'VKWebAppAccessTokenFailed':
      api.hadnleAccessTokenEventFailed(e.detail);
      if (!accountActions.inited) {
        store.dispatch({type: actionTypes.VK_FAILED});
      }
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
      actions.resolveVkPayRequest(false, true);
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
connect.send('VKWebAppGetUserInfo', {});
connect.send('VKWebAppGetClientVersion', {});
connect.send('VKWebAppGetAuthToken', {app_id: window.appId, scope: 'stories,notifications'});

function render() {
  ReactDOM.render(
    <Provider store={store}>
      <App store={store} router={router} />
    </Provider>,
    document.getElementById('root')
  );
}

// for debug
const isDebug = utils.isDev() && utils.isInspectOpen();
if (isDebug && !window.isOK && !window.isNative) {
  window._DEBUG_TOKEN = localStorage.getItem('_token');
  accountActions.init(window._DEBUG_TOKEN);
}

window.adsEmpty = () => {
  store.dispatch({type: actionTypes.ADS_UPDATE, shown: false});
};

if (window.isOK) {
  window.onload = () => {
    Proxy.init('ok').then(() => {
      accountActions.init();
    }).catch((err) => {
      console.log("FAIL", err)
    });
  };
} else if (urlToken) {
  window.isDG = !window.isNative;

  let scope = 0;
  if (urlParams && urlParams.get) {
    scope = parseInt(urlParams.get('api_settings'), 10);
  }

  window.isDGNotifiEnabled = scope & 1 === 1;
  window.isDGMessagesBlocked = parseInt(urlParams.get('is_messages_blocked'), 10);
} else if (urlSign && window.isDesktop || !window.isDG) {
  //!isDebug && accountActions.init();
}

if (window.isNative) {
  window.onload = () => {
    accountActions.init(urlToken);
    Proxy.init('vk_apps');
    render();
  };
} else if (window.isDG) {
  window.onload = () => {
    Proxy.init('direct_games');
    accountActions.init(urlToken);
    render();
  };
} else {
  render();
}

window.onresize = () => {
  Cards.shared && Cards.shared._updateHeight();
};

utils.updateVkFrameHeight();

if (window.adsCompany) {
  utils.statReachGoal(`external_ads_${window.adsCompany}`);
}

if (window.isFromAdsLove) {
  utils.statReachGoal('ads_ref_love');
}

if (window.isPromoStory) {
  utils.statReachGoal('promo_story_click');
}

if (window.isNative) {
  native.listen();
}

