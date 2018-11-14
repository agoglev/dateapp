import React from 'react';
import * as actionTypes from './actionTypes';
import store from '../store';
import * as actions from './index';
import * as api from '../services/api';
import * as activityActions from "./activity";
import * as utils from "../utils";
import * as pages from "../constants/pages";

let isStopped = true;
let timer = false;
let isConnecting = false;
let connectingUser = false;
let isBusy = false;
let connectedUser = {};
let accepted = false;

export function loadChat() {
  isStopped = false;
  clearTimeout(timer);
  actions.setData('isLoading', true, pages.LIVE_CHAT);
  actions.setData('isConnecting', false, pages.LIVE_CHAT);
  actions.setData('isEnded', false, pages.LIVE_CHAT);
  actions.setData('isNeedPay', false, pages.LIVE_CHAT);
  isConnecting = false;
  connectingUser = false;
  connectedUser = false;
  accepted = false;
  isBusy = false;
  api.method(api.methods.liveChatsGet, {
    wait_pay: actions.getData(pages.LIVE_CHAT).waitForPay ? 1 : 0
  }).then((resp) => {
    actions.setData('availChats', parseInt(resp.avail_count, 10), pages.LIVE_CHAT);
    if (isBusy || isStopped) {
      return;
    }
    clearTimeout(timer);

    actions.setData('isConnecting', true, pages.LIVE_CHAT);
    actions.setData('waitForPay', false, pages.LIVE_CHAT);

    isBusy = true;
    isConnecting = true;
    connectingUser = resp.user;
    timer = setTimeout(loadChat, 6000);

    if (accepted === resp.user.id) {
      acceptEventDidReceive(resp.user.id);
    }
  }).catch((err) => {
    if (isBusy || isStopped) {
      return;
    }
    clearTimeout(timer);
    if (err.message === 'payment') {
      isBusy = true;
      actions.setData('isNeedPay', true, pages.LIVE_CHAT);
      actions.setData('isLoading', false, pages.LIVE_CHAT);
      actions.setData('waitForPay', false, pages.LIVE_CHAT);
      utils.statReachGoal('live_chats_need_pay');
    } else {
      timer = setTimeout(loadChat, 3000);
    }
  });
}

export function checkEventDidReceive(userId) {
  const state = store.getState();
  let accept = 0;
  if (!isBusy && state.activeView === 'modal' && state.activePanels.modal === pages.LIVE_CHAT) {
    clearTimeout(timer);
    isBusy = true;
    actions.setData('isConnecting', true, pages.LIVE_CHAT);
    accept = 1;
  }

  api.method(api.methods.liveChatsReason, {
    accept: accept,
    user_id: userId
  }).then((resp) => {
    actions.setData('availChats', parseInt(resp.avail_count, 10), pages.LIVE_CHAT);
    if (resp.user) {
      connectedUser = resp.user;
      resetVars();
      utils.statReachGoal('live_chat_created');
    }
  }).catch(loadChat);
}

function resetVars() {
  actions.setData('messages', [], pages.LIVE_CHAT);
  actions.setData('isLiked', false, pages.LIVE_CHAT);
  actions.setData('user', connectedUser, pages.LIVE_CHAT);
  actions.setData('isLoading', false, pages.LIVE_CHAT);
}

export function leaveEventDidReceive(userId) {
  if (userId === connectedUser.id) {
    actions.setData('isEnded', true, pages.LIVE_CHAT);
    seen();
  }
}

export function acceptEventDidReceive(userId) {
  if (userId === connectingUser.id) {
    clearTimeout(timer);
    connectedUser = connectingUser;
    resetVars();
    accepted = false;
    utils.statReachGoal('live_chat_created');
  } else {
    accepted = userId;
  }
}

export function rejectEventDidReceive(userId) {
  loadChat();
}

export function messageEventDidReceive(userId, type, extra) {
  if (userId === connectedUser.id) {
    let message = actions.getData(pages.LIVE_CHAT).messages;
    message.push(makeMessage(type, extra, false));
    actions.setData('messages', message, pages.LIVE_CHAT);
  }
}

export function sendMessage(text) {
  return new Promise((resolve, reject) => {
    api.method(api.methods.liveChatsMessage, {
      text,
      user_id: connectedUser.id
    }).then(() => {
      let message = actions.getData(pages.LIVE_CHAT).messages;
      message.push(makeMessage('text', text));
      actions.setData('messages', message, pages.LIVE_CHAT);
      resolve();
    }).catch(reject);
  });
}

function makeMessage(type, extra, isOutBox = true) {
  let res = {type, isOutBox};
  switch (type) {
    case 'text':
      res.text = extra;
      break;
  }
  return res;
}

export function leaveChat() {
  if (!connectedUser.id) {
    return;
  }
  clearTimeout(timer);
  isStopped = true;
  api.method(api.methods.liveChatsLeave, {
    user_id: connectedUser.id
  }).then((resp) => {
    seen();
    actions.setData('availChats', parseInt(resp.avail_count, 10), pages.LIVE_CHAT);
  });
  connectedUser = {};
}

export function like() {
  actions.setData('isLiked', true, pages.LIVE_CHAT);
  api.method(api.methods.liveChatsLike, {
    user_id: connectedUser.id
  }).then((resp) => {
    seen();
    actions.setData('availChats', parseInt(resp.avail_count, 10), pages.LIVE_CHAT);
  });
}

export function seen() {
  api.method(api.methods.liveChatsSeen, {
    user_id: connectedUser.id
  });
}
