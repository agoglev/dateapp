import React from 'react';
import { Alert, ActionSheet, ActionSheetItem, platform, IOS } from '@vkontakte/vkui';
import NotificationsPermission from '../components/NotificationsPermission/NotificationsPermission';

import connect from '@vkontakte/vkui-connect';
import * as actionTypes from './actionTypes';
import store from '../store';
import router from '../router';
import * as api from '../services/api';
import * as pages from '../constants/pages';

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
  store.dispatch({type: actionTypes.SET_TAB, tab: tabName});
}

export function setData(field, value, page) {
  store.dispatch({
    type: actionTypes.SET_DATA,
    field,
    value,
    page
  });
}

let _hideErrorTimer = false;
export function showError(text) {
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
    ageTo: userInfo.filters.age_to
  };

  go(pages.FILTERS, params);
}

export function openJoinStep3() {
  let params = {
    photos: {}
  };

  go(pages.JOIN_STEP3, params);
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

    actions.push({
      title: 'Отменить',
      autoclose: true,
      action: reject,
      style: 'cancel'
    });

    const popout =  <Alert
      actions={actions}
      onClose={ () => setPopout() }
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
  store.dispatch({type: actionTypes.SET_POPOUT, popout})
}

export function requestMessagesPermissions() {
  setPopout(<NotificationsPermission
    title="Включите уведомления"
    caption="Чтобы быть в&nbsp;курсе новых лайков и&nbsp;сообщений, разрешите присылать уведомления"
    type="messages"
    onClick={() => connect.send("VKWebAppAllowNotifications", {})}
  />);
}
