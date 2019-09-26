import * as actions from './index';
import * as api from '../services/api';
import * as pages from '../constants/pages';

let loadType = false;
let loadQuery = false;
export function loadReports(type = 'all', query = '') {
  actions.setData('isLoading', true, pages.MODER);
  actions.setData('isFailed', false, pages.MODER);

  loadType = type;
  loadQuery = query;

  api.method(api.methods.reports, {
    type,
    query
  }).then(({reports}) => {
    if (type !== loadType || loadQuery !== query) {
      return;
    }

    actions.setData('reports', reports, pages.MODER);
    actions.setData('isLoading', false, pages.MODER);
  }).catch(() => {
    actions.setData('isLoading', false, pages.MODER);
    actions.setData('isFailed', true, pages.MODER);
  });
}

export function skipReport(report) {
  actions.loaderShow();
  api.method(api.methods.skipReport, {
    user_id: report.user.id
  }).then(() => {
    report.isSkipped = true;
    setReport(report);
    actions.loaderHide();
  }).catch(() => actions.showError());
}

export function banReport(report) {
  actions.loaderShow();
  api.method(api.methods.banReport, {
    user_id: report.user.id
  }).then(() => {
    report.isBanned = true;
    setReport(report);
    actions.loaderHide();
  }).catch(() => actions.showError());
}

export function restoreReport(report) {
  if (report.isSkipped) {
    delete report.isSkipped;
    setReport(report);
  } else if (report.isBanned) {
    actions.loaderShow();
    api.method(api.methods.skipReport, {
      user_id: report.user.id
    }).then(() => {
      delete report.isBanned;
      setReport(report);
      actions.loaderHide();
    }).catch(() => actions.showError());
  }
}

function setReport(newData) {
  let { reports } = actions.getData(pages.MODER);
  for (let i = 0; i < reports.length; i++) {
    if (reports[i].user.id === newData.user.id) {
      reports[i] = newData;
      actions.setData('reports', reports, pages.MODER);
      break;
    }
  }
}

export function loadStats() {
  actions.setDataMulti({
    isLoading: true,
    isFailed: false
  }, pages.MODER_STATS);

  api.method(api.methods.moderStats).then(({stats}) => {
    actions.setDataMulti({
      isLoading: false,
      stats
    }, pages.MODER_STATS);
  }).catch(() => {
    actions.setDataMulti({
      isLoading: false,
      isFailed: true
    }, pages.MODER_STATS);
  });
}

export function loadMessages(report) {
  return new Promise((resolve, reject) => {
    actions.loaderShow();
    api.method(api.methods.reportMessages, {
      user_id: report.user.id
    }).then((messages) => {
      actions.loaderHide();
      resolve(messages);
    }).catch(() => {
      actions.showError();
      reject();
    });
  });
}
