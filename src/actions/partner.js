import * as api from '../services/api';
import * as action from './index';
import * as pages from '../constants/pages';

export function enable() {
  return new Promise((resolve, reject) => {
    api.method(api.methods.partnerEnable, {
      group_id: window.GroupId
    }).then(() => {
      action.setData('enabled', true, pages.ADMIN);
      resolve();
    }).catch((err) => reject(err));
  });
}

export function withdrawal() {
  return new Promise((resolve, reject) => {
    api.method(api.methods.partnerWithdrawal, {
      group_id: window.GroupId
    }).then(() => {
      action.setData('hasWithdrawal', true, pages.ADMIN);
      resolve();
    }).catch((err) => reject(err));
  });
}
