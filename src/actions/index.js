import React from 'react';
import { Alert, ActionSheet, ActionSheetItem, platform, IOS } from '@vkontakte/vkui';
import NotificationsPermission from '../components/NotificationsPermission/NotificationsPermission';

import connect from '@vkontakte/vkui-connect';
import * as actionTypes from './actionTypes';
import store from '../store';
import router from '../router';
import * as api from '../services/api';
import * as pages from '../constants/pages';
import * as accountActions from "./account";
import * as activityActions from "./activity";
import * as moderActions from "./moder";
import * as liveChatsActions from "./live_chats";
import * as utils from "../utils";
import * as payments from "./payments";

const osname = platform();

export let clientVersion = {
  major: 0,
  minor: 0
};
export let clientPlatform = '';

export function setVersion(platform, version) {
  clientPlatform = platform;
  let exp = version.split('.').map((item) => parseInt(item, 10));
  clientVersion.major = exp[0];
  clientVersion.minor = exp[1];
}

export function go(panel, params = {}) {
  router.navigate(panel, params);
}

export function fakeGo(panel, params = {}) {
  const state = store.getState();
  const from = state.activePanels[state.activeView];
  store.dispatch({ type: actionTypes.NAVIGATE, from: {
    name: from
  }, to: {
    name: panel
  } });
}

export function setTab(tabName) {
  let params = {};
  if (tabName === 'search') {
    //const state = store.getState();
    //const user = state.usersInfo[state.userId];
    //const age = utils.getUsrAge(user.age_ts);
    setDataMulti({
      //filterGender: user.gender === 2 ? 'girls' : 'mans',
      filterSort: 'all',
      //ageFrom: Math.max(17, age - 5),
      //ageTo: Math.min(age + 5, 55)
      filterGender: accountActions.searchFilters.gender,
      //filterSort: accountActions.searchFilters.sort,
      ageFrom: accountActions.searchFilters.age.from,
      ageTo: accountActions.searchFilters.age.to,
    }, pages.SEARCH);

    utils.statReachGoal('search_page');
  } else if (tabName === 'messages') {
    params.tab = 'chats';
    activityActions.load();
  }

  setData(params, tabName);
  store.dispatch({type: actionTypes.SET_TAB, tab: tabName});
  if (window.isDesktop) {
    go(pages.TAB);
  }
}

export function setData(field, value, page) {
  if (utils.isObject(field)) {
    store.dispatch({
      type: actionTypes.SET_DATA_MULTI,
      changes: field,
      page: value
    });
  } else {
    store.dispatch({
      type: actionTypes.SET_DATA,
      field,
      value,
      page
    });
  }
}

export function setDataMulti(data, page) {
  for (let i in data) {
    setData(i, data[i], page);
  }
}

export function getData(page) {
  const state = store.getState();
  return state.pageData[page] || {};
}

let _hideErrorTimer = false;
export function showError(text = 'Произошла ошибка') {
  clearTimeout(_hideErrorTimer);
  store.dispatch({
    type: actionTypes.SHOW_ERROR,
    text
  });
  _hideErrorTimer = setTimeout(() => store.dispatch({type: actionTypes.HIDE_ERROR}), 3000);
}

export function uploadPhoto(file) {
  return api.method(api.methods.uploadPhoto, {
    file
  });
}

let _loaderTimer = false;
export function loaderShow() {
  clearTimeout(_loaderTimer);
  store.dispatch({
    type: actionTypes.SHOW_LOADER,
  });
}

export function loaderHide() {
  clearTimeout(_loaderTimer);
  store.dispatch({
    type: actionTypes.HIDE_LOADER,
  });
}

export function loaderSuccess() {
  clearTimeout(_loaderTimer);
  store.dispatch({
    type: actionTypes.SHOW_LOADER_SUCCESS,
  });
  _loaderTimer = setTimeout(loaderHide, 2000);
}

export function setUser(user) {
  setUsers([user]);
}

export function setUsers(users) {
  let set = {};
  for (let i = 0; i < users.length; i++) {
    set[users[i].id] = users[i];
  }
  store.dispatch({type: actionTypes.SET_USERS_INFO, users: set});
}

export function openEditProfile() {
  const state = store.getState();
  const userInfo = state.usersInfo[state.userId] || {};

  let photos = {};
  for (let i = 0; i < userInfo.photos.length; i++) {
    const photo = userInfo.photos[i];
    photos[parseInt(photo.position, 10) - 1] = {
      id: photo.id,
      url: photo.photo600
    };
  }

  let params = {
    name: userInfo.name,
    birthday: {
      day: userInfo.bday,
      month: userInfo.bmonth,
      year: userInfo.byear
    },
    gender: userInfo.gender,
    purpose: userInfo.purpose,
    job: userInfo.job || '',
    education: userInfo.education || '',
    about: userInfo.about || '',
    country: {
      id: userInfo.country_id,
      title: userInfo.country_name
    },
    city: {
      id: userInfo.city_id,
      title: userInfo.city_name,
      country_id: userInfo.country_id
    },
    photos,
    deletedPhotos: {}
  };

  go(pages.EDIT_PROFILE, params);
}

export function openFilters() {
  const state = store.getState();
  const userInfo = state.usersInfo[state.userId] || {};

  let params = {
    man: userInfo.filters.man,
    woman: userInfo.filters.woman,
    ageFrom: userInfo.filters.age_from,
    ageTo: userInfo.filters.age_to,
    onlyCity: userInfo.filters.only_city
  };

  go(pages.FILTERS, params);
}

export function openChat(peerId) {
  let params = {
    peerId,
    isFirstShow: true
  };

  go(pages.IM_HISTORY, params);
}

export function openLikes() {
  let params = {
    likes: []
  };

  go(pages.LIKES, params);
  activityActions.loadLikes();
}

export function openStats() {
  let params = {
    stats: [],
    isLoading: true,
    isFailed: false,
    selected: 6
  };

  go(pages.STATS, params);
  accountActions.loadStats();

  utils.statReachGoal('stats_page');
}

export function openJoinStep1(user) {
  user.photo = user.photo_max_orig || user.photo_max;
  go(pages.JOIN_STEP1, user);
}

export function openJoinStep2() {
  const vkUserInfo = store.getState().vkUserInfo;

  let params = {};

  if (accountActions.JoinInfo.country) {
    params.country = accountActions.JoinInfo.country;
  } else if (vkUserInfo.country) {
    params.country = vkUserInfo.country;
  }

  if (accountActions.JoinInfo.city) {
    params.city = accountActions.JoinInfo.city;
  } else if (vkUserInfo.city) {
    params.city = vkUserInfo.city;
  }

  go(pages.JOIN_STEP2, params);
}

export function openJoinStep3() {
  let params = {
    photos: {}
  };

  const vkUserInfo = store.getState().vkUserInfo;
  if (window.isDG) {
    const photoUrl = vkUserInfo.photo_max ? vkUserInfo.photo_max : vkUserInfo.photo_200;
    if (photoUrl && photoUrl.indexOf('camera_') === -1 && photoUrl.indexOf('/images/') === -1) {
      params.photos[0] = {
        url: vkUserInfo.photo_max ? vkUserInfo.photo_max : vkUserInfo.photo_200,
        needUpload: true
      };
    }
  } else if (window.isOK) {
    const vkUserInfo = store.getState().vkUserInfo;
    if (vkUserInfo.pic_max) {
      params.photos[0] = {
        url: vkUserInfo.pic_max,
        needUpload: true
      };
    }
  } else if (vkUserInfo && vkUserInfo.photo_max_orig) {
    const photoUrl = vkUserInfo.photo_max_orig;
    if (photoUrl && photoUrl.indexOf('camera_') === -1 && photoUrl.indexOf('/images/') === -1) {
      params.photos[0] = {
        url: photoUrl,
        needUpload: true
      };
    }
  }

  go(pages.JOIN_STEP3, params);
}

export function openModer() {
  let params = {
    reports: [],
    isLoading: true,
    isFailed: false,
    type: 'template'
  };

  go(pages.MODER, params);
  moderActions.loadReports();
}

export function openAdmin() {
  loaderShow();
  api.method(api.methods.partnerLoad, {
    group_id: window.GroupId
  }).then((resp) => {
    let params = {
      membersCount: resp.members,
      membersCountInt: resp.members_int,
      membersToday: resp.members_today,
      membersTodayInt: resp.members_today_int,
      canEnable: !!resp.can_enable,
      enabled: !!resp.enabled,
      canEnabledFrom: resp.can_enabled_from,
      moneyTotal: resp.money_total,
      moneyAvail: resp.money_avail,
      moneyAvailInt: resp.money_avail_int,
      moneyToday: resp.money_today,
      canWithdrawal: resp.can_withdrawal,
      withdrawalLimitMsg: resp.withdrawal_limit_msg,
      hasWithdrawal: resp.has_withdrawal
    };

    go(pages.ADMIN, params);
  }).catch(err => showError(err.message));
}

export function openAdminWithdrawal() {
  loaderShow();
  api.method(api.methods.partnerWithdrawalHistory, {
    group_id: window.GroupId
  }).then((history) => {
    go(pages.ADMIN_WITHDRAWAL_HISTORY, { history });
  }).catch(err => showError(err.message));
}

export function openModerStats() {
  let params = {
    isLoading: true,
    isFailed: false,
    stats: []
  };

  go(pages.MODER_STATS, params);
  moderActions.loadStats();
}

export function openNotify() {
  let params = {
    isLoading: true,
    isFailed: false,
    settings: {}
  };

  go(pages.NOTIFY, params);
  accountActions.loadNotifySettings();
}

export function openGifts(userId, target = '') {
  let params = {
    userId,
    target
  };

  go(pages.GIFTS, params);
}

export function openPremium() {
  let params = {
    isLoading: true,
    isFailed: false
  };

  go(pages.PREMIUM, params);
}

export function openGiftSend(userId, gift, target = '') {
  let gifts = store.getState().gifts.filter((gift) => gift.available);
  let slideIndex = 0;
  for (let i = 0; i < gifts.length; i++) {
    if (gifts[i].id === gift.id) {
      slideIndex = i;
      break;
    }
  }

  let params = {
    userId,
    gift,
    slideIndex,
    message: '',
    target
  };

  go(pages.GIFT_SEND, params);
}

export function openProfile(user, opts = {}) {
  let params = {
    user,
    isLoading: true,
    isFailed: false,
    fromLikes: opts.fromLikes || false,
    fromHistory: opts.fromHistory || false,
    fromSearch: opts.fromSearch || false,
    fromCards: opts.fromCards || false,
    fromFeature: opts.fromFeature || false,
    hideControls: opts.hideControls || false
  };

  go(pages.PROFILE, params);
  accountActions.loadFullProfile(user.id);
}

export function showAlert(title, message, okText = false, opts = {}) {
  return new Promise((resolve, reject) => {
    let actions = [];
    if (okText) {
      actions.push({
        title: okText,
        autoclose: true,
        action: resolve,
        style: opts.okStyle
      });
    }

    if (!opts.skipCancelButton) {
      actions.push({
        title: 'Отменить',
        autoclose: true,
        action: reject,
        style: 'cancel'
      });
    }

    const popout =  <Alert
      actions={actions}
      onClose={ () => setPopout() }
      actionsLayout={opts.actionsList ? 'vertical' : 'horizontal'}
    >
      <h2>{title}</h2>
      <p>{message}</p>
    </Alert>;

    setPopout(popout);
  });
}

export function showActionSheet(options, title = '', text = '') {
  let actions = options.map((option, i) => {
    let props = {
      key: i,
      autoclose: true,
      theme: option.theme
    };
    if (option.onClick) {
      props.onClick = option.onClick;
    }
    if (option.hasOwnProperty('autoclose')) {
      props.autoclose = option.autoclose;
    }
    return <ActionSheetItem {...props}>{option.title}</ActionSheetItem>
  });

  const popout =  <ActionSheet
    onClose={ () => setPopout() }
    title={title}
    text={text}
  >
    {actions}
    {osname === IOS && <ActionSheetItem autoclose theme="cancel">Отмена</ActionSheetItem>}
  </ActionSheet>;

  setPopout(popout);
}

export function setPopout(popout = null) {
  if (popout) {
    go(pages.POPOUT);
  } else {
    const state = store.getState();
    if (state.popout !== null) {
      window.history.back();
    }
  }
  store.dispatch({type: actionTypes.SET_POPOUT, popout})
}

export function requestMessagesPermissions() {
  setPopout(<NotificationsPermission
    title="Включите уведомления"
    caption="Чтобы быть в&nbsp;курсе новых лайков и&nbsp;сообщений, разрешите присылать уведомления"
    type="messages"
    onClick={() => {
      if (window.isDG) {
        window.VK.callMethod('showSettingsBox', 1);
      } else {
        connect.send('VKWebAppAllowNotifications', {});
      }
    }}
  />);
}

export function initRetry() {
  store.dispatch({type: actionTypes.APP_INIT_RETRY});
  if (utils.isDev() && utils.isInspectOpen()) {
    accountActions.init(window._DEBUG_TOKEN);
  } else if (window.isDG) {
    accountActions.init(window.urlToken);
  } else {
   connect.send('VKWebAppGetAuthToken', {app_id: 6682509, scope: ''});
  }
}

let vkPayPromise = false;
export function vkPayRequest(amount, description) {
  return new Promise((resolve, reject) => {
    vkPayPromise = {resolve, reject};
    connect.send('VKWebAppOpenPayForm', {app_id: 6682509, action: 'pay-to-group', params: {
        group_id: 160479731,
        amount,
        description: description + `\nНе меняйте сумму платежа, иначе деньги будут отправлены в пустую!`
      }});
  });
}

export function vkPay(type, extraFields = {}) {
  return new Promise((resolve, reject) => {
    vkPayPromise = {resolve, reject};
    api.method(api.methods.payParams, {
      type,
      is_ios: utils.isIOS() ? 1 : 0,
      ...extraFields
    }).then((params) => {
      connect.send('VKWebAppOpenPayForm', {app_id: 6682509, action: 'pay-to-service', params});
    }).catch(() => {
      vkPayPromise = false;
      reject();
    });
  });
}

export function resolveVkPayRequest(status, error = false) {
  if (vkPayPromise) {
    if (status) {
      vkPayPromise.resolve();
    } else {
      vkPayPromise.reject(error);
    }
  }
  vkPayPromise = false;
}

export let isNeedFeatureBoxShow = false;
export function setNeedFeatureBoxState(needShow) {
  isNeedFeatureBoxShow = needShow;
}

export function openLiveChat() {
  go(pages.LIVE_CHAT, {
    isLoading: true,
    //user: store.getState().usersInfo[1],
    //messages: []
  });
  setTimeout(liveChatsActions.loadChat, 1000);

  utils.statReachGoal('live_chats_open');
}

export function hideImNotifyRequest() {
  store.dispatch({type: actionTypes.IM_NOTIFY_SET, enabled: true});
}

export function openInvites() {
  let params = {
    isLoading: true,
    points: null
  };

  go(pages.INVITES, params);
  accountActions.loadInvites();
}

export function openExtraInfoEdit(type) {
  const state = store.getState();
  const userInfo = state.usersInfo[state.userId] || {};
  const extra = userInfo.extra || {};

  const data = {
    type,
    children: parseInt(extra.children, 10) || 0,
    alcohol: parseInt(extra.alcohol, 10) || 0,
    home: parseInt(extra.home, 10) || 0,
    relations: parseInt(extra.relations, 10) || 0,
    gender: parseInt(extra.gender, 10) || 0,
    smoke: parseInt(extra.smoke, 10) || 0,
  };

  go(pages.EDIT_EXTRA_INFO, {
    value: data[type],
    ...data
  });
}

export function featureSuggestionShown() {
  store.dispatch({type: actionTypes.FEATURE_SUGGESTION_SHOWN});
  api.method(api.methods.featureSuggestionSeen);
}

export function publishStory() {
  api.requestAccessToken('stories', false).then((token) => {
    loaderShow();
    api.vk('stories.getPhotoUploadServer', {
      add_to_news: 1,
      link_text: 'open',
      link_url: 'https://vk.com/app6682509#story',
      access_token: token
    }).then((res) => {
      api.method(api.methods.publishStory, {
        url: res.upload_url,
      }).then((ret) => {
        if (ret.got_premium) {
          loaderHide();
          payments.setPremiumState(true);
          showAlert('История опубликована', 'Вы получили премиум на одни сутки!', 'OK', {skipCancelButton: true});
          store.dispatch({type: actionTypes.SET_PROMO_BITS, bits: store.getState().promoBits + payments.PromoBits.story});
          utils.statReachGoal('promo_story_publish');
        } else {
          loaderSuccess();
        }
      }).catch((err) => showError(err.message));
    }).catch(() => showError());
  });
}

export function openMonetization() {
  go(pages.MONETIZATION, {});
}