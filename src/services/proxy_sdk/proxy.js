import VkApps from './vkapps';
import DirectGames from './direct_games';

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
    }

    Sdk.init();
  },
  allowMessagesFromGroup: (groupId, key = '') => Sdk.allowMessagesFromGroup(groupId, key),
  getGeodata: () => Sdk.getGeodata()
};
