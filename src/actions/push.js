import store from '../store';
import * as actionTypes from './actionTypes';

let HideTimer = false;
let LastId = 0;

export function showNotification(type, title, message, opts = {}) {
  let items = store.getState().pushNotifications;

  items.push({
    id: ++LastId,
    type,
    title,
    message,
    iconSrc: opts.iconSrc,
    onClick: () => {
      hideNotifications();
      opts.onClick && opts.onClick();
    }
  });

  store.dispatch({type: actionTypes.SET_PUSH_NOTIFICATIONS, items});

  clearTimeout(HideTimer);
  HideTimer = setTimeout(hideNotifications, opts.timeout || 3000);
}

export function hideNotifications() {
  clearTimeout(HideTimer);
  store.dispatch({type: actionTypes.SET_PUSH_NOTIFICATIONS, items: []});
}
