import connect from "@vkontakte/vkui-connect/index";

let promises = {};

function bindEvents() {
  const VK = window.VK;
  VK.addCallback('onAllowMessagesFromCommunity', () => {
    if (promises.allowMessagesFromGroup) {
      promises.allowMessagesFromGroup.resolve();
    }
  });
  VK.addCallback('onAllowMessagesFromCommunityCancel', () => {
    if (promises.allowMessagesFromGroup) {
      promises.allowMessagesFromGroup.reject();
    }
  });
}

export default {
  init() {
    if (!window.VK) {
      return;
    }
    window.VK.init(function () {
      bindEvents();
    }, function () {
      document.body.innerHTML = 'Ошибка';
    }, '5.87', window.queryStr);
  },

  allowMessagesFromGroup(groupId) {
    return new Promise((resolve, reject) => {
      promises.allowMessagesFromGroup = {resolve, reject};
      window.VK.callMethod('showAllowMessagesFromCommunityBox', groupId);
    });
  },

  getGeodata() {
    return new Promise((resolve, reject) => {
      reject();
    });
  }
}
