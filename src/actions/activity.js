import * as actionTypes from './actionTypes';
import store from '../store';
import * as actions from './index';
import * as accountActions from './account';
import * as api from '../services/api';
import * as utils from '../utils';
import * as pages from '../constants/pages';
import ImHistory from "../containers/Modals/ImHistory";

export const SystemMessageType = {
  match: 1,
  gift: 2
};

export function load() {
  return new Promise((resolve, reject) => {
    if (store.getState().dialogs.length > 0) {
      //resolve();
      //return;
    }

    api.method(api.methods.activity).then(({dialogs, likes, featured_users}) => {
      // dialogs
      actions.setUsers(dialogs.map(dialog => dialog.user));
      store.dispatch({type: actionTypes.DIALOGS_SET, dialogs});

      // likes
      actions.setUsers(likes.map(like => like.user));
      store.dispatch({type: actionTypes.LIKES_SET, likes});

      // featured users
      actions.setUsers(featured_users);
      store.dispatch({type: actionTypes.FEATURED_USERS_SET, users: featured_users});

      resolve();

      checkFeatureTT();
    }).catch(() => {
      reject();
    });
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
    }).then(({history}) => {
      store.dispatch({type: actionTypes.HISTORY_SET, peerId, history});
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

export function sendMessage(peerId, text) {
  console.log('sendMessage', text);
  const msgId = new Date().getTime();
  const msg = {
    id: msgId,
    text,
    add_date: msgId,
    isSending: true,
    kludges: {},
    unread: 1
  };
  addMessage(peerId, msg);

  api.method(api.methods.sendMessage, {
    peer_id: peerId,
    text: text
  })
    .then(() => {
      msg.isSending = false;
      updateMessage(peerId, msgId, msg);
      updateDialog(peerId, {
        message: msg
      });
      moveDialogToTop(peerId);
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

function updateDialog(peerId, updates) {
  let { dialogs } = store.getState();
  for (let i = 0; i < dialogs.length; i++) {
    if (dialogs[i].id === peerId) {
      dialogs[i] = Object.assign({}, dialogs[i], updates);
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

  if (!updateDialog(peerId, dialog)) {
    dialogs.unshift(dialog);
    store.dispatch({type: actionTypes.DIALOGS_SET, dialogs});
  }

  history.push(dialog.message);
  store.dispatch({type: actionTypes.HISTORY_SET, peerId, history});

  if (state.activeView === 'base' && state.activePanels.base === pages.IM_HISTORY) {
    ImHistory.scrollToBottom();
  }

  accountActions.showBadge();
}

export function newLikeEventDidReceive(like) {
  accountActions.showBadge();
  store.dispatch({type: actionTypes.SET_LIKES_BADGE, hasBadge: true});

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
  return;
  let { likes } = store.getState();

  for (let i = 0; i < likes.length; i++) {
    if (likes[i].user.id === userId) {
      likes.splice(i, 1);
      store.dispatch({type: actionTypes.LIKES_SET, likes});
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
      removeLikeById(userId);
      if (action === 'like' && !fromFeature) {
        addNewDialog(dialog);
      }
      resolve();
    }).catch(reject);
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

  store.dispatch({type: actionTypes.SET_LIKES_BADGE, hasBadge: hasLikeBadge});

  api.method(api.methods.readLike, {
    from_id: userId
  });
}

function checkFeatureTT() {
  const state = store.getState();
  if (!window.isDG || state.usersInfo[state.userId].register_days < 1) {
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
