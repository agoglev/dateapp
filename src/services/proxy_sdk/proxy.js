import VkApps from './vkapps';
import DirectGames from './direct_games';
import OK from './ok';

let Platform = '';
let Sdk;

export default {
  init(platform) {
    Platform = platform;

    switch (platform) {
      case 'vk_apps':
        Sdk = VkApps;
        break;
      case 'direct_games':
        Sdk = DirectGames;
        break;
      case 'ok':
        Sdk = OK;
        break;
    }

    return Sdk.init();
  },
  allowMessagesFromGroup: (groupId, key = '') => Sdk.allowMessagesFromGroup(groupId, key),
  getGeodata: () => Sdk.getGeodata(),
  showSubscriptionBox: (item, action = 'create', subscription_id = 1) => Sdk.showSubscriptionBox(item, action, subscription_id)
};
