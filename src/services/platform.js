const Platforms = {
  directGames: 'directGames',
  vkApps: 'vkApps'
};

function paltform() {
  if (window.isDG) {
    return Platforms.directGames;
  } else {
    return Platforms.vkApps;
  }
}
