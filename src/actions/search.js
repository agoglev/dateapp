import * as actionTypes from './actionTypes';
import store from '../store';
import * as actions from './index'
import * as api from '../services/api';
import * as utils from '../utils';
import * as pages from '../constants/pages';
import connect from '@vkontakte/vkui-connect';

let lastLoadTs = 0;
export function init() {
  const data = actions.getData(pages.SEARCH);
  const ts = new Date().getTime();
  if (data.users && ts - lastLoadTs < 60 * 1000) {
    return;
  }
  lastLoadTs = ts;
  load();

  connect.send("VKWebAppGetGeodata", {});
}

function makeFilters() {
  const data = actions.getData(pages.SEARCH);
  return {
    gender: data.filterGender,
    sort: data.filterSort,
    age_from: data.ageFrom,
    age_to: data.ageTo
  };
}

export function load(skipLoader = false) {
  if (!skipLoader) {
    actions.setData('isLoading', true, pages.SEARCH);
  }
  actions.setData('isFailed', false, pages.SEARCH);
  actions.setData('isLoadingMore', false, pages.SEARCH);
  api.method(api.methods.search, makeFilters()).then(({users, nextFrom}) => {
    actions.setUsers(users);
    actions.setData('users', users, pages.SEARCH);
    actions.setData('nextFrom', nextFrom, pages.SEARCH);
  }).catch(() => {
    actions.setData('isFailed', true, pages.SEARCH);
  }).then(() => {
    actions.setData('isLoading', false, pages.SEARCH);
  });
}

export function loadMore() {
  const data = actions.getData(pages.SEARCH);
  actions.setData('isLoadingMore', true, pages.SEARCH);
  api.method(api.methods.search, {
    ...makeFilters(),
    start_from: data.nextFrom
  }).then(({users, nextFrom}) => {
    let oldUsers = {};
    for (let i = 0; i < data.users.length; i++) {
      oldUsers[data.users[i].id] = true;
    }

    let newUsers = data.users;
    for (let i = 0; i < users.length; i++) {
      const userId = users[i].id;
      if (!oldUsers[userId]) {
        newUsers.push(users[i]);
      }
    }

    actions.setUsers(users);
    actions.setData('users', newUsers, pages.SEARCH);
    actions.setData('nextFrom', nextFrom, pages.SEARCH);
    actions.setData('isLoadingMore', false, pages.SEARCH);
  }).catch(() => {
    actions.setData('isLoadingMore', false, pages.SEARCH);
  });
}
