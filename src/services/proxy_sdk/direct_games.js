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

  VK.addCallback('onSubscriptionCancel', () => {
    if (promises.subscriptionBox) {
      promises.subscriptionBox.reject();
    }
  });
  VK.addCallback('onSubscriptionFail', () => {
    if (promises.subscriptionBox) {
      promises.subscriptionBox.reject();
    }
  });
  VK.addCallback('onSubscriptionSuccess', () => {
    if (promises.subscriptionBox) {
      promises.subscriptionBox.resolve();
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
  },

  showSubscriptionBox(item, action, subscription_id) {
    return new Promise((resolve, reject) => {
      promises.subscriptionBox = {resolve, reject};
      window.VK.callMethod('showSubscriptionBox', action, {item, subscription_id});
    });
  }
}
