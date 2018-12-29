import connect from '@vkontakte/vkui-connect';

let promises = {};

export default {
  init() {
    connect.send('VKWebAppInit', {});
    connect.subscribe((e) => {
      const data = e.detail.data;
      switch (e.detail.type) {
        case 'VKWebAppAllowMessagesFromGroupResult':
          console.log(data);
          if (promises.VKWebAppAllowMessagesFromGroup) {
            promises.VKWebAppAllowMessagesFromGroup.resolve(data);
          }
          break;
        case 'VKWebAppAllowMessagesFromGroupFailed':
          if (promises.VKWebAppAllowMessagesFromGroup) {
            promises.VKWebAppAllowMessagesFromGroup.reject(data);
          }
          break;
      }
    });
  },

  allowMessagesFromGroup(groupId, key) {
    return new Promise((resolve, reject) => {
      promises.VKWebAppAllowMessagesFromGroup = {resolve, reject};
      connect.send('VKWebAppAllowMessagesFromGroup', {group_id: groupId, key});
    });
  }
}
