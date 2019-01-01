import connect from "@vkontakte/vkui-connect/index";

let promises = {};

export default {
  init() {
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
