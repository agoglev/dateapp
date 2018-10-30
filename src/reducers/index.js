import * as actionTypes from '../actions/actionTypes';
import * as pages from '../constants/pages';
import { navThree } from '../router';

const initialState = {
  userId: 0,
  token: null,
  appInited: false,
  needJoin: false,
  activeView: 'base',
  activePanels: {
    base: pages.MAIN,
    join: pages.JOIN_INTRO
  },
  pageData: {},
  activeTab: '',
  history: [],
  vkUserInfo: {
    first_name: 'test'
  },
  error: false,
  globalLoader: false,
  vkAccessToken: '',
  cards: [],
  dislikedCards: [],
  dialogs: [],
  imHistory: {},
  usersInfo: {},
  gifts: [],
  likes: [],
  popout: null,
  hasBadge: false,
  needTokenMessage: false,
  works: false, // engineering works
  tabBarAdsShown: false,
  featuredUsers: []
};

let navHistory = [];

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.NAVIGATE: {
      if (action.to.name === pages.POPOUT || action.from && action.from.name === pages.POPOUT) {
        return Object.assign({}, state, {popout: null});
      }

      const historyLen = navHistory.length - 1;
      const isBack = action.from && action.from.name === navHistory[historyLen] && navHistory[historyLen - 1] === action.to.name;

      if (isBack) {
        navHistory.pop();
        if (action.to.name === pages.JOIN_STEP3 && (!action.from || action.from.name !== pages.VK_PHOTOS)) {
          // ToDo: need to close app
          for (let i = 0; i < 5; i++) {
            window.history.back();
          }
        }
      } else {
        navHistory.push(action.to.name);
      }

      const nextView = navThree[action.to.name];
      let newState = {
        pageData: state.pageData,
        activePanels: Object.assign({}, state.activePanels, {
          [nextView]: action.to.name
        }),
        error: false,
        globalLoader: false
      };

      if (nextView !== state.activeView) {
        newState.activeView = nextView;
      }

      if (action.from && isBack && [pages.JOIN_STEP1, pages.JOIN_STEP2, pages.JOIN_STEP3].indexOf(action.from.name) === -1) {
          delete newState.pageData[action.from.name];
      }
      if (!newState.pageData[action.to.name]) {
        newState.pageData[action.to.name] = {};
      }

      if (!isBack) {
        newState.pageData[action.to.name] = Object.assign({}, newState.pageData[action.to.name], action.to.params);
      }

      return Object.assign({}, state, newState);
    }

    case actionTypes.SET_TAB: {
      return Object.assign({}, state, {activeTab: action.tab});
    }

    case actionTypes.SET_DATA: {
      return Object.assign({}, state, {
        pageData: Object.assign({}, state.pageData, {
          [action.page]: Object.assign({}, state.pageData[action.page], {
            [action.field]: action.value
          })
        })
      });
    }

    case actionTypes.APP_INITED: {
      return Object.assign({}, state, {
        appInited: true,
        needJoin: action.needJoin,
        token: action.token,
        userId: action.userId,
        gifts: action.gifts,
        hasBadge: action.hasBadge,
        needTokenMessage: false
      });
    }

    case actionTypes.APP_INIT_RETRY: {
      return Object.assign({}, state, {appInited: false});
    };

    case actionTypes.SETUP_VK_USER_INFO: {
      return Object.assign({}, state, {vkUserInfo: action.info, needTokenMessage: false});
    }

    case actionTypes.SHOW_ERROR: {
      return Object.assign({}, state, {error: action.text, globalLoader: false});
    }

    case actionTypes.HIDE_ERROR: {
      return Object.assign({}, state, {error: false, globalLoader: false});
    }

    case actionTypes.SHOW_LOADER: {
      return Object.assign({}, state, {globalLoader: 1, error: false});
    }

    case actionTypes.HIDE_LOADER: {
      return Object.assign({}, state, {globalLoader: false});
    }

    case actionTypes.SHOW_LOADER_SUCCESS: {
      return Object.assign({}, state, {globalLoader: 2, error: false});
    }

    case actionTypes.SET_VK_ACCESS_TOKEN: {
      return Object.assign({}, state, {vkAccessToken: action.token});
    }

    case actionTypes.CARDS_SET: {
      return Object.assign({}, state, {cards: action.cards});
    }

    case actionTypes.CARDS_DISLIKED_SET: {
      return Object.assign({}, state, {dislikedCards: action.dislikedCards});
    }

    case actionTypes.DIALOGS_SET: {
      return Object.assign({}, state, {dialogs: action.dialogs});
    }

    case actionTypes.HISTORY_SET: {
      return Object.assign({}, state, {
        imHistory: Object.assign({}, state.imHistory, {
          [action.peerId]: action.history
        })
      });
    }

    case actionTypes.SET_USERS_INFO: {
      return Object.assign({}, state, {
        usersInfo: Object.assign({}, state.usersInfo, action.users)
      });
    }

    case actionTypes.LIKES_SET: {
      return Object.assign({}, state, {likes: action.likes});
    }

    case actionTypes.FEATURED_USERS_SET: {
      return Object.assign({}, state, {featuredUsers: action.users});
    }

    case actionTypes.SET_POPOUT: {
      return Object.assign({}, state, {popout: action.popout});
    }

    case actionTypes.SET_BADGE: {
      return Object.assign({}, state, {hasBadge: action.hasBadge});
    }

    case actionTypes.VK_FAILED: {
      return Object.assign({}, state, {needTokenMessage: true});
    }

    case actionTypes.WORKS: {
      return Object.assign({}, state, {works: true});
    }

    case actionTypes.ADS_UPDATE: {
      return Object.assign({}, state, {tabBarAdsShown: action.shown});
    }

    default:
      return state;
  }
};
