import createRouter from 'router5'
import browserPlugin from 'router5/plugins/browser'
import listenersPlugin from 'router5/plugins/listeners'
import * as pages from './constants/pages';

export const routes = [
  {
    name: pages.MAIN,
    path: '/',
    view: 'base'
  },
  {
    name: pages.TEST,
    path: `${pages.TEST}`,
    view: 'modal'
  },

  // Join
  {
    name: pages.JOIN_STEP1,
    path: `${pages.JOIN_STEP1}`,
    view: 'join'
  },
  {
    name: pages.JOIN_STEP2,
    path: `${pages.JOIN_STEP2}`,
    view: 'join'
  },
  {
    name: pages.JOIN_STEP3,
    path: `${pages.JOIN_STEP3}`,
    view: 'join'
  },

  // Utils
  {
    name: pages.SELECT_COUNTRY,
    path: `${pages.SELECT_COUNTRY}`,
    view: 'utils'
  },
  {
    name: pages.SELECT_CITY,
    path: `${pages.SELECT_CITY}`,
    view: 'utils'
  },

  // IM
  {
    name: pages.IM_HISTORY,
    path: pages.IM_HISTORY,
    view: 'base'
  },

  {
    name: pages.PROFILE,
    path: pages.PROFILE,
    view: 'modal'
  },

  {
    name: pages.EDIT_PROFILE,
    path: pages.EDIT_PROFILE,
    view: 'modal'
  },

  {
    name: pages.FILTERS,
    path: pages.FILTERS,
    view: 'filters'
  },

  {
    name: pages.VK_PHOTOS,
    path: pages.VK_PHOTOS,
    view: 'vk_photos'
  },

  {
    name: pages.POPOUT,
    path: pages.POPOUT,
    view: 'base'
  },

  {
    name: pages.LIKES,
    path: pages.LIKES,
    view: 'likes'
  },

  {
    name: pages.LIVE_CHAT,
    path: pages.LIVE_CHAT,
    view: 'modal'
  }
];

const params = {
  defaultRoute: pages.MAIN,
  defaultParams: {}
};

let _navThree = {};
for (let i = 0; i < routes.length; i++) {
  const route = routes[i];
  _navThree[route.name] = route.view;
}

export const navThree = _navThree;

let router = createRouter(routes, params)
  .usePlugin(browserPlugin({ base: '.', useHash: false }))
  .usePlugin(listenersPlugin());

export default router;