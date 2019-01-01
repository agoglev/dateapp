import connect from '@vkontakte/vkui-connect';

let promises = {};

function resolvePromise(key, status, data) {
  if (promises[key]) {
    if (status) {
      promises[key].resolve(data);
    } else {
      promises[key].reject(data);
    }
    delete promises[key];
  }
}

export default {
  init() {
    connect.send('VKWebAppInit', {});
    connect.subscribe((e) => {
      const type = e.detail.type;
      const data = e.detail.data;
      switch (type) {
        case 'VKWebAppAllowMessagesFromGroupResult':
          resolvePromise('VKWebAppAllowMessagesFromGroup', true, data);
          break;
        case 'VKWebAppAllowMessagesFromGroupFailed':
          resolvePromise('VKWebAppAllowMessagesFromGroup', false, data);
          break;
        case 'VKWebAppGeodataResult':
          resolvePromise('VKWebAppGetGeodata', true, data);
          break;
        case 'VKWebAppGeodataFailed':
          resolvePromise('VKWebAppGetGeodata', false, data);
          break;
      }
    });
  },

  allowMessagesFromGroup(groupId, key) {
    return new Promise((resolve, reject) => {
      promises.VKWebAppAllowMessagesFromGroup = {resolve, reject};
      connect.send('VKWebAppAllowMessagesFromGroup', {group_id: groupId, key});
    });
  },

  getGeodata() {
    return new Promise((resolve, reject) => {
      promises.VKWebAppGetGeodata = {resolve, reject};
      connect.send('VKWebAppGetGeodata', {});
    });
  }
}
