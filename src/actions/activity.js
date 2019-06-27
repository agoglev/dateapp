import * as actionTypes from './actionTypes';
import store from '../store';
import * as actions from './index';
import * as accountActions from './account';
import * as api from '../services/api';
import * as utils from '../utils';
import * as pages from '../constants/pages';
import ImHistory from "../containers/Modals/ImHistory";
import * as pushActions from './push';
import {loaderSuccess} from "./index";
import {showError} from "./index";
import {loaderShow} from "./index";
import {loaderHide} from "./index";
import {showAlert} from "./index";
import * as payments from "./payments";

export const SystemMessageType = {
  match: 1,
  gift: 2
};

export let inboxFavs = {};
export let favCanWrite = {};

export function load() {
  actions.setData({
    nextFrom: false,
    isLoading: true,
    isFailed: false,
  }, pages.ACTIVITY);
  return new Promise((resolve, reject) => {
    if (store.getState().dialogs.length > 0) {
      //resolve();
      //return;
    }

    api.method(api.methods.activity).then(({dialogs, likes, featured_users, next_from, new_guests, likes_count, new_fav}) => {
      // dialogs
      actions.setUsers(dialogs.map(dialog => dialog.user));
      store.dispatch({type: actionTypes.DIALOGS_SET, dialogs});

      // likes
      actions.setUsers(likes.map(like => like.user));
      store.dispatch({type: actionTypes.LIKES_SET, likes});

      // featured users
      actions.setUsers(featured_users);
      store.dispatch({type: actionTypes.FEATURED_USERS_SET, users: featured_users});

      actions.setData({
        nextFrom: next_from,
        isLoading: false,
        newGuests: new_guests,
        newFav: new_fav,
        likesCount: likes_count
      }, pages.ACTIVITY);

      resolve();

      checkFeatureTT();
    }).catch((err) => {
      actions.setData({
        isLoading: false,
        isFailed: err.message
      }, pages.ACTIVITY);
      reject();
    });
  });
}

export function loadMore() {
  const startFrom = actions.getData(pages.ACTIVITY).nextFrom;
  return new Promise((resolve, reject) => {
    api.method(api.methods.activityMore, {
      start_from: startFrom
    }).then(({dialogs, next_from}) => {
      if (startFrom !== actions.getData(pages.ACTIVITY).nextFrom) {
        return;
      }

      const state = store.getState();
      let dialogsMap = {};
      for (let i = 0; i < state.dialogs.length; i++) {
        dialogsMap[state.dialogs[i].id] = true;
      }

      let filteredDialogs = [];
      for (let i = 0; i < dialogs.length; i++) {
        if (dialogsMap[dialogs[i].id]) {
          continue;
        }
        filteredDialogs.push(dialogs[i]);
      }
      actions.setUsers(filteredDialogs.map(dialog => dialog.user));
      store.dispatch({type: actionTypes.DIALOGS_SET, dialogs: state.dialogs.concat(filteredDialogs)});

      actions.setData('nextFrom', next_from, pages.ACTIVITY);

      resolve();
    }).catch(reject);
  });
}

export function loadFeaturedUsers() {
  const state = store.getState();
  if (!state.featuredUsers.length) {
    return;
  }

  api.method(api.methods.featuredUsers).then((featuredUsers) => {
    actions.setUsers(featuredUsers);
    store.dispatch({type: actionTypes.FEATURED_USERS_SET, users: featuredUsers});
  });
}

export function loadHistory(peerId) {
  return new Promise((resolve, reject) => {
    api.method(api.methods.imHistory, {
      peer_id: peerId
    }).then(({history, peer, banned}) => {
      actions.setUser(peer);
      store.dispatch({type: actionTypes.HISTORY_SET, peerId, history});
      actions.setData('isBanned', banned, pages.IM_HISTORY);
      resolve();
    }).catch(reject);
  });
}

export function addMessage(peerId, message) {
  const history = store.getState().imHistory[peerId] || [];
  history.push(message);
  store.dispatch({type: actionTypes.HISTORY_SET, peerId, history});
}

function updateMessage(peerId, msgId, msg) {
  let history = store.getState().imHistory[peerId] || [];
  for (let i = 0; i < history.length; i++) {
    if (history[i].id === msgId) {
      history[i] = msg;
      store.dispatch({type: actionTypes.HISTORY_SET, peerId, history});
      break;
    }
  }
}

export function addGiftMessage(peerId, giftId, text) {
  const msgId = new Date().getTime();
  const msg = {
    id: msgId,
    text,
    add_date: msgId,
    kludges: {
      gift_id: giftId
    },
    unread: 1,
    system: SystemMessageType.gift
  };
  addMessage(peerId, msg);
}

export function sendMessage(peerId, text, sticker = false) {
  const msgId = new Date().getTime();
  let msg = {
    id: msgId,
    text,
    add_date: msgId,
    isSending: true,
    kludges: {},
    unread: 1,
  };
  if (sticker) {
    msg.kludges.sticker_id = sticker.id;
    msg.kludges.sticker_url = sticker.url;
  }

  addMessage(peerId, msg);

  api.method(api.methods.sendMessage, {
    peer_id: peerId,
    text: text,
    sticker: sticker ? sticker.id : 0
  })
    .then((peer) => {
      actions.setUser(peer);
      msg.isSending = false;
      updateMessage(peerId, msgId, msg);
      updateDialog(peerId, {
        message: msg
      }, true);
      utils.statReachGoal('message_sent');
    })
    .catch((error) => {
      actions.showError(error.message);
      msg.isFailed = true;
      msg.isSending = false;
      updateMessage(peerId, msgId, msg);
      utils.statReachGoal('message_failed');
    });
}

export function sendPhotoMessage(peerId, photo) {
  const msgId = new Date().getTime();
  const msg = {
    id: msgId,
    text: '',
    add_date: msgId,
    isSending: true,
    sendingPhoto: photo,
    kludges: {
      photo_url: photo.base64,
      photo_width: photo.width,
      photo_height: photo.height
    },
    unread: 1
  };
  addMessage(peerId, msg);

  api.method(api.methods.sendPhotoMessage, {
    peer_id: peerId,
    file: photo.file
  })
    .then(() => {
      msg.isSending = false;
      updateMessage(peerId, msgId, msg);
      updateDialog(peerId, {
        message: msg
      });
      moveDialogToTop(peerId);
    })
    .catch((error) => {
      actions.showError(error.message);
      msg.isFailed = true;
      msg.isSending = false;
      updateMessage(peerId, msgId, msg);
    });
}

export function retrySendMessage(peerId, message) {
  message.isFailed = false;
  message.isSending = true;

  updateMessage(peerId, message.id, message);

  let method;
  let params = {
    peer_id: peerId
  };

  if (message.sendingPhoto) {
    method = api.methods.sendPhotoMessage;
    params.file = message.sendingPhoto.file;
  } else {
    method = api.methods.sendMessage;
    params.text = message.text;
  }

  api.method(method, params)
    .then(() => {
      message.isSending = false;
      updateMessage(peerId, message.id, message);
      updateDialog(peerId, {
        message: message
      });
      moveDialogToTop(peerId);
    }).catch((error) => {
      actions.showError(error.message);
      message.isFailed = true;
      message.isSending = false;
      updateMessage(peerId, message.id, message);
    });
}

function updateDialog(peerId, updates, isNeedMoveToTop = false) {
  let { dialogs } = store.getState();
  for (let i = 0; i < dialogs.length; i++) {
    if (dialogs[i].id === peerId) {
      dialogs[i] = Object.assign({}, dialogs[i], updates);
      if (isNeedMoveToTop) {
        dialogs.unshift(dialogs.splice(i, 1)[0]);
      }
      store.dispatch({type: actionTypes.DIALOGS_SET, dialogs});
      return true;
    }
  }
  return false;
}

function moveDialogToTop(peerId) {
  let { dialogs } = store.getState();
  for (let i = 0; i < dialogs.length; i++) {
    if (dialogs[i].id === peerId) {
      dialogs.unshift(dialogs.splice(i, 1)[0]);
      store.dispatch({type: actionTypes.DIALOGS_SET, dialogs});
      break;
    }
  }
}

export function markAsSeen(peerId) {
  updateDialog(peerId, {
    badge: 0
  });

  let history = store.getState().imHistory[peerId] || [];
  for (let i = 0; i < history.length; i++) {
    if (history[i].inbox) {
      history[i].unread = 0;
    }
  }
  store.dispatch({type: actionTypes.HISTORY_SET, peerId, history});

  api.method(api.methods.imMarkAsSeen, {
    peer_id: peerId
  });
}

export function newMessageEventDidReceive(dialog) {
  const state = store.getState();

  const peerId = dialog.id;
  let dialogs = state.dialogs;
  let history = state.imHistory[peerId] || [];

  actions.setUser(dialog.user);

  // check for repeat
  for (let i = 0; i < history.length; i++) {
    if (history[i].id === dialog.message.id) {
      return false;
    }
  }

  if (!updateDialog(peerId, dialog, true)) {
    dialogs.unshift(dialog);
    store.dispatch({type: actionTypes.DIALOGS_SET, dialogs});
  }

  history.push(dialog.message);
  store.dispatch({type: actionTypes.HISTORY_SET, peerId, history});

  if (state.activeView === 'base' && state.activePanels.base === pages.IM_HISTORY) {
    ImHistory.scrollToBottom();
  }

  if (state.activeView === 'base' && state.activeTab !== 'messages') {
    const title = utils.genderText(dialog.user.gender, [
      '{name} написал вам сообщение',
      '{name} написала вам сообщение'
    ]).replace('{name}', dialog.user.name);
    pushActions.showNotification('message', title, getMessagePreviewStr(dialog.message), {
      iconSrc: dialog.user.small_photo,
      onClick: () => actions.openChat(peerId)
    });
  }

  accountActions.showBadge();
}

function getMessagePreviewStr(message) {
  switch (message.system) {
    case SystemMessageType.gift:
      return 'Подарок';
    default:
      if (message.kludges.photo_url) {
        return 'Фотография';
      } else {
        return message.text;
      }
  }
}

export function newLikeEventDidReceive(like) {
  accountActions.showBadge();

  const state = store.getState();
  if (state.activeView === 'likes') {
    let { likes } = actions.getData(pages.LIKES);
    for (let i = 0; i < likes.length; i++) {
      if (likes[i].user.id === like.user.id) {
        return;
      }
    }
    like.unread = 1;
    likes.unshift(like);
    actions.setData('likes', likes, pages.LIKES);
  }

  let likesCount = actions.getData(pages.ACTIVITY).likesCount || 0;
  likesCount++;
  actions.setData({likesCount}, pages.ACTIVITY);
}

function addNewDialog(dialog) {
  let { dialogs } = store.getState();

  if (!updateDialog(dialog.id, dialog)) {
    dialogs.unshift(dialog);
    store.dispatch({type: actionTypes.DIALOGS_SET, dialogs});
  }
}

export function readHistoryEventDidReceive(peerId) {
  let history = store.getState().imHistory[peerId] || [];
  for (let i = 0; i < history.length; i++) {
    if (!history[i].inbox) {
      history[i].unread = 0;
    }
  }
  store.dispatch({type: actionTypes.HISTORY_SET, peerId, history});
}

function removeLikeById(userId) {
  let { likes } = actions.getData(pages.LIKES);

  for (let i = 0; i < likes.length; i++) {
    if (likes[i].user.id === userId) {
      likes.splice(i, 1);
      actions.setData({likes}, pages.LIKES);
      break;
    }
  }
}

export function likeAction(userId, action, fromFeature) {
  return new Promise((resolve, reject) => {
    api.method(api.methods.likesAction, {
      user_id: userId,
      action: action === 'like' ? 1 : 0
    }).then((dialog) => {
      if (action === 'like' && !fromFeature) {
        addNewDialog(dialog);
      }
      if (action === 'dislike') {
        removeLikeById(userId);
        let likesCount = actions.getData(pages.ACTIVITY).likesCount || 0;
        likesCount = Math.max(0, likesCount - 1);
        actions.setData({likesCount}, pages.ACTIVITY);
      }
      resolve();
    }).catch(reject);
  });
}

export function unlike(userId) {
  return new Promise((resolve, reject) => {
    api.method(api.methods.likesAction, {
      user_id: userId,
      action: 0,
      unlike: 1
    }).then(() => resolve()).catch(reject);
  });
}

export function clearHistory(peerId) {
  return new Promise((resolve, reject) => {
    api.method(api.methods.clearHistory, {
      peer_id: peerId
    }).then(() => {
      let { dialogs } = store.getState();
      for (let i = 0; i < dialogs.length; i++) {
        if (dialogs[i].id === peerId) {
          dialogs.splice(i, 1);
          store.dispatch({type: actionTypes.DIALOGS_SET, dialogs});
          break;
        }
      }
      resolve();
    }).catch(reject);
  });
}

export function addMeToFeatured() {
  const state = store.getState();
  let featuredUsers = state.featuredUsers;
  let user = state.usersInfo[state.userId];
  featuredUsers.unshift(user);
  store.dispatch({type: actionTypes.FEATURED_USERS_SET, users: featuredUsers});
}

export function loadLikes() {
  actions.setData('isLoading', true, pages.LIKES);
  actions.setData('isFailed', false, pages.LIKES);
  api.method(api.methods.getLikes).then((resp) => {
    actions.setUsers(resp.likes.map(like => like.user));
    actions.setData('count', resp.count, pages.LIKES);
    actions.setData('likes', resp.likes, pages.LIKES);
    actions.setData('nextFrom', resp.next_from, pages.LIKES)
  }).catch(() => {
    actions.setData('isFailed', true, pages.LIKES);
  }).then(() => {
    actions.setData('isLoading', false, pages.LIKES);
  });
}

export function loadMoreLikes() {
  const pageData = actions.getData(pages.LIKES);
  actions.setData('isLoadingMore', true, pages.LIKES);
  api.method(api.methods.getLikes, {
    start_from: pageData.nextFrom
  }).then((resp) => {
    actions.setUsers(resp.likes.map(like => like.user));
    actions.setData('likes', pageData.likes.concat(resp.likes), pages.LIKES);
    actions.setData('nextFrom', resp.next_from, pages.LIKES);
    actions.setData('isLoadingMore', false, pages.LIKES);
  }).catch(() => {
    actions.setData('isLoadingMore', false, pages.LIKES);
  });
}

export function readLike(userId) {
  let likes = actions.getData(pages.LIKES).likes;
  let hasLikeBadge = false;
  for (let i = 0; i < likes.length; i++) {
    let like = likes[i];
    if (like.user.id === userId) {
      like.unread = false;
      likes[i] = like;
      actions.setData('likes', likes, pages.LIKES);
    }
    if (like.unread) {
      hasLikeBadge = true;
    }
  }

  api.method(api.methods.readLike, {
    from_id: userId
  });
}

function checkFeatureTT() {
  const state = store.getState();
  if (state.usersInfo[state.userId].register_days < 1 || window.isDesktop) {
    return;
  }
  api.vk('storage.get', {
    keys: 'activity_feature_tt_shown'
  }).then((keysRaw) => {
    let keys = {};
    for (let i = 0; i < keysRaw.length; i++) {
      const item = keysRaw[i];
      keys[item.key] = parseInt(item.value, 10) || 0;
    }

    if (keys.activity_feature_tt_shown !== 1) {
      store.dispatch({type: actionTypes.FEATURE_TT_SET, shown: true});
    }
  });
}

export function hideFeatureTT() {
  store.dispatch({type: actionTypes.FEATURE_TT_SET, shown: false});
  api.vk('storage.set', {
    key: `activity_feature_tt_shown`,
    value: '1'
  });
}

export function toggleBan(peerId) {
  return new Promise((resolve, reject) => {
    const data = actions.getData(pages.IM_HISTORY);
    api.method(data.isBanned ? api.methods.unBan : api.methods.ban, {
      id: peerId
    }).then(() => {
      actions.setData('isBanned', !data.isBanned, pages.IM_HISTORY);
      resolve();
    }).catch(reject);
  });
}

export function loadGuests() {
  actions.setData({
    isLoadingGuests: true,
    isFailedGuests: false,
    newGuests: false
  }, pages.ACTIVITY);
  api.method(api.methods.guests).then(({guests, next_from}) => {
    actions.setUsers(guests);
    actions.setData({
      isLoadingGuests: false,
      guests,
      guestsNextFrom: next_from
    }, pages.ACTIVITY);
  }).catch((err) => {
    actions.setData({
      isLoadingGuests: false,
      isFailedGuests: err.message
    }, pages.ACTIVITY);
  });
}

export function loadMoreGuests() {
  const startFrom = actions.getData(pages.ACTIVITY).guestsNextFrom;
  return new Promise((resolve, reject) => {
    api.method(api.methods.guests, {
      start_from: startFrom
    }).then(({guests, next_from}) => {
      if (startFrom !== actions.getData(pages.ACTIVITY).guestsNextFrom) {
        return;
      }

      const currentGuests = actions.getData(pages.ACTIVITY).guests;
      let dialogsMap = {};
      for (let i = 0; i < currentGuests.length; i++) {
        dialogsMap[currentGuests[i].id] = true;
      }

      let filteredDialogs = [];
      for (let i = 0; i < guests.length; i++) {
        if (dialogsMap[guests[i].id]) {
          continue;
        }
        filteredDialogs.push(guests[i]);
      }
      actions.setUsers(guests);
      actions.setData({
        guestsNextFrom: next_from,
        guests: currentGuests.concat(filteredDialogs)
      }, pages.ACTIVITY);

      resolve();
    }).catch(reject);
  });
}

export function loadFav() {
  actions.setData({
    isLoadingFav: true,
    isFailedFav: false,
    newFav: false
  }, pages.ACTIVITY);
  api.method(api.methods.favorites).then(({favorites, next_from, can_write}) => {
    for (let i = 0; i < favorites.length; i++) {
      const item = favorites[i];
      if (item.is_inbox_fav) {
        inboxFavs[parseInt(item.id, 10)] = true;
      }
    }

    favCanWrite = can_write;

    actions.setUsers(favorites);
    actions.setData({
      isLoadingFav: false,
      favorites,
      favNextFrom: next_from
    }, pages.ACTIVITY);
  }).catch((err) => {
    actions.setData({
      isLoadingFav: false,
      isFailedFav: err.message
    }, pages.ACTIVITY);
  });
}

export function loadMoreFav() {
  const startFrom = actions.getData(pages.ACTIVITY).favNextFrom;
  return new Promise((resolve, reject) => {
    api.method(api.methods.favorites, {
      start_from: startFrom
    }).then(({favorites, next_from}) => {
      if (startFrom !== actions.getData(pages.ACTIVITY).favNextFrom) {
        return;
      }

      const currentGuests = actions.getData(pages.ACTIVITY).favorites;
      let dialogsMap = {};
      for (let i = 0; i < currentGuests.length; i++) {
        dialogsMap[currentGuests[i].id] = true;
      }

      let filteredDialogs = [];
      for (let i = 0; i < favorites.length; i++) {
        if (dialogsMap[favorites[i].id]) {
          continue;
        }
        filteredDialogs.push(favorites[i]);
      }
      actions.setUsers(favorites);
      actions.setData({
        favNextFrom: next_from,
        favorites: currentGuests.concat(filteredDialogs)
      }, pages.ACTIVITY);

      resolve();
    }).catch(reject);
  });
}

export function removeFromFav(profileId) {
  actions.loaderShow();
  api.method(api.methods.toggleFav, {
    user_id: profileId,
    is_fav: 0
  }).then(() => {
    let favorites = actions.getData(pages.ACTIVITY).favorites;
    for (let i = 0; i < favorites.length; i++) {
      if (favorites[i].id === profileId) {
        favorites.splice(i, 1);
        actions.setData({favorites}, pages.ACTIVITY);
        break;
      }
    }
    updateDialog(profileId, {
      is_fav: false
    });
    actions.loaderSuccess();
  }).catch(() => actions.showError());
}

export function toggleFav(peerId, isFav) {
  return new Promise((resolve, reject) => {
    api.method(api.methods.toggleFav, {
      user_id: peerId,
      is_fav: isFav ? 1 : 0
    }).then(() => {
      updateDialog(peerId, {
        is_fav: isFav
      });
      resolve();

      if (isFav) {
        utils.statReachGoal('fav');
      }
    }).catch((err) => reject(err));
  });
}

export function userAreOnline(user) {
  const state = store.getState();
  if (state.activeView === 'base') {
    actions.setUser(user);
    const title = utils.genderText(user.gender, [
      '{name} появился онлайн',
      '{name} появилась онлайн'
    ]).replace('{name}', user.name);
    pushActions.showNotification('online', title, 'Написать сообщение', {
      onClick: () => actions.openChat(user.id),
      iconSrc: user.small_photo
    });
  }
}

export function newGuset(user) {
  const state = store.getState();
  if (state.activeView === 'base') {
    actions.setUser(user);
    const title = utils.genderText(user.gender, [
      '{name} посетил Вашу анкету',
      '{name} посетила Вашу анкету'
    ]).replace('{name}', user.name);
    pushActions.showNotification('guest', title, 'Открыть', {
      onClick: () => actions.openProfile(user.id),
      iconSrc: user.small_photo
    });
  }
}

let _isStickersTTShown = false;
export function needShowStickersTT() {
  return new Promise((resolve) => {
    if (_isStickersTTShown) {
      return resolve(false);
    }

    api.vk('storage.get', {
      key: 'activity_stickers_tt_shown'
    }).then((resp) => {
      if (parseInt(resp, 10) === 1) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

export function stickersTTShown() {
  _isStickersTTShown = true;
  api.vk('storage.set', {
    key: 'activity_stickers_tt_shown',
    value: 1,
  });
}

export function publishStory() {
  return new Promise((resolve, reject) => {
    api.requestAccessToken('stories', false).then((token) => {
      actions.loaderShow();
      api.vk('stories.getPhotoUploadServer', {
        add_to_news: 1,
        link_text: 'open',
        link_url: 'https://vk.com/app6682509#story',
        access_token: token,
        skip_premium: 1
      }).then((res) => {
        api.method(api.methods.publishStory, {
          url: res.upload_url,
        }).then(() => {
          loaderHide();
          resolve();
        }).catch((err) => {
          showError(err.message);
          reject();
        });
      }).catch(() => {
        showError();
        reject();
      });
    });
  });
}