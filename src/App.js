import './css/style.css';
import './App.css';
import './css/PushNotification.css';

import React from 'react';
import { View } from '@vkontakte/vkui';
import '@vkontakte/vkui/dist/vkui.css';
import { connect } from 'react-redux';
import * as pages from './constants/pages';
import * as UI from '@vkontakte/vkui';
import * as utils from './utils';
import * as pushActions from './actions/push';

import Main from './containers/Main/Main';

import JoinStep1 from './containers/Join/JoinStep1';
import JoinStep2 from './containers/Join/JoinStep2';
import JoinStep3 from './containers/Join/JoinStep3';

import SelectCountry from './containers/Utils/SelectCountry';
import SelectCity from './containers/Utils/SelectCity';

import ImHistory from './containers/Modals/ImHistory';
import ProfileView from './containers/ProfileView/ProfileView';
import EditProfile from './containers/EditProfile/EditProfile';
import EditExtraInfo from './containers/EditProfile/EditExtraInfo';
import Filters from './containers/Filters/Filters';
import VkPhotos from './containers/VkPhotos/VkPhotos';
import Likes from './containers/Likes/Likes';
import LiveChat from "./containers/DateChats/LiveChat";
import Stats from "./containers/Stats/Stats";
import Moder from "./containers/Moder/Moder";
import ModerStats from "./containers/Moder/ModerStats";
import Notify from "./containers/Notify/Notify";
import Premium from "./containers/Premium/Premium";
import Invites from "./containers/Invites/Invites";

import PlaceholderDeleted from './components/Placeholder/PlaceholderDeleted';
import PlaceholderBanned from './components/Placeholder/PlaceholderBanned';
import PlaceholderNeedToken from "./components/Placeholder/PlaceholderNeedToken";
import PlaceholderWorks from "./components/Placeholder/PlaceholderWorks";
import Gifts from "./containers/Gifts/Gifts";
import GiftSend from "./containers/Gifts/GiftSend";

class App extends React.Component {
	render() {
		return (
      <div>
				{this._renderError()}
        {this._renderLoader()}
        {this._renderPushNotifications()}
				{this._renderContent()}
			</div>
		);
	}

	_renderError() {
    const { state } = this.props;

    if (!state.error) {
    	return null;
		}

		return (
			<div className="Error" style={{top: utils.getHeaderHeight()}}>{state.error}</div>
		)
	}

  _renderLoader() {
    const { state } = this.props;

    if (!state.globalLoader) {
      return null;
    }

    const className = utils.classNames({
      global_loader: true,
      global_loader_success: state.globalLoader === 2
    });

    return (
      <div className={className}>
        <div className="global_loader_cont">
          <div className="global_loader_success">
            <svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 26l11.646 11.646a.5.5 0 0 0 .708 0L44 10" stroke="currentColor" strokeWidth="2" fill="none"
                    fillRule="evenodd" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      </div>
    )
  }

  _renderPushNotifications() {
	  return this.props.state.pushNotifications.map((notification, i) => {
	    const className = utils.classNames({
        PushNotification: true,
        [notification.type]: true,
        hasShadow: i === 0
      });
	    return (
	      <div className={className} key={notification.id} onClick={notification.onClick}>
          <div className="PushNotification__icon" style={{backgroundImage: `url(${notification.iconSrc})`}} />
          <div className="PushNotification__cont">
            <div className="PushNotification__title">{notification.title}</div>
            <div className="PushNotification__message">{notification.message}</div>
          </div>
          <div className="PushNotification__close" onClick={() => pushActions.hideNotifications()} />
        </div>
      )
    });
  }

  _getBaseHeader(view) {
    const { state } = this.props;

    if (view === 'modal') {
      if (state.activePanels.modal === pages.PROFILE) {
        return false;
      }
    }

    return true;
  }

	_renderContent() {
    const { state } = this.props;

    if (state.works === true) {
      return (
        <PlaceholderWorks />
      )
    }

    const userInfo = state.usersInfo[this.props.state.userId] || {};
    if (userInfo.deleted) {
      return (
        <PlaceholderDeleted />
      )
    }

    if (userInfo.banned) {
      return (
        <PlaceholderBanned />
      )
    }

    if (this.props.state.needTokenMessage === true) {
      return (
        <PlaceholderNeedToken />
      )
    }

    if (window.isDesktop) {
      return this._renderDesktop();
    }

    return (
      <UI.Root activeView={state.activeView} popout={this.props.state.popout}>
        <View activePanel={state.activePanels.base} id="base" header={this._getBaseHeader('base')}>
          <Main id={pages.MAIN} state={state} />
          <ImHistory id={pages.IM_HISTORY} state={state} />
        </View>
        <UI.View activePanel={state.activePanels.join} id="join">
          <JoinStep1 id={pages.JOIN_STEP1} state={state} />
          <JoinStep2 id={pages.JOIN_STEP2} state={state} />
          <JoinStep3 id={pages.JOIN_STEP3} state={state} />
        </UI.View>
        <View activePanel={state.activePanels.likes} id="likes" header={this._getBaseHeader('likes')}>
          <Likes id={pages.LIKES} state={state} />
        </View>
        <View activePanel={state.activePanels.filters} id="filters" header={this._getBaseHeader('filters')}>
          <Filters id={pages.FILTERS} state={state} />
        </View>
        <View activePanel={state.activePanels.invites} id="invites" header={this._getBaseHeader('invites')}>
          <Invites id={pages.INVITES} state={state} />
        </View>
        <View activePanel={state.activePanels.modal} id="modal" header={this._getBaseHeader('modal')}>
          <ProfileView id={pages.PROFILE} state={state} />
          <EditProfile id={pages.EDIT_PROFILE} state={state} />
          <EditExtraInfo id={pages.EDIT_EXTRA_INFO} state={state} />
          <LiveChat id={pages.LIVE_CHAT} state={state} />
          <Stats id={pages.STATS} state={state} />
          <Moder id={pages.MODER} state={state} />
          <ModerStats id={pages.MODER_STATS} state={state} />
          <Notify id={pages.NOTIFY} state={state} />
          <Gifts id={pages.GIFTS} state={state} />
          <GiftSend id={pages.GIFT_SEND} state={state} />
          <Premium id={pages.PREMIUM} state={state} />
        </View>
        <View activePanel={state.activePanels.vk_photos} id="vk_photos" header={this._getBaseHeader('vk_photos')}>
          <VkPhotos id={pages.VK_PHOTOS} state={state} />
        </View>
        <View activePanel={state.activePanels.utils} id="utils">
          <SelectCountry id={pages.SELECT_COUNTRY} state={state} />
          <SelectCity id={pages.SELECT_CITY} state={state} />
        </View>
      </UI.Root>
    );
	}

  _renderDesktop() {
    const state = this.props.state;
    const page = state.activePanels[state.activeView];

	  const modal = this._renderDesktopModal(page);
	  return (
	    <div className="Desktop__content">
        {this.props.state.popout && <div className="App__popout">{this.props.state.popout}</div>}
        <Main id={pages.MAIN} state={this.props.state} />
        {modal && <div className={`App__modal ${page}`} onClick={(e) => {
          if (e.target.classList.contains('App__modal')) {
            window.history.back();
          }
        }}>
          <div className="App__modal__cont">{modal}</div>
        </div>}
      </div>
    )
  }

  _renderDesktopModal(page) {
    const state = this.props.state;
	  switch (page) {
      case pages.PROFILE:
        return <ProfileView id={pages.PROFILE} state={state} />;
      case pages.IM_HISTORY:
        return <ImHistory id={pages.IM_HISTORY} state={state} />;
      case pages.FILTERS:
        return <Filters id={pages.FILTERS} state={state} />;
      case pages.LIKES:
        return <Likes id={pages.LIKES} state={state} />;
      case pages.EDIT_PROFILE:
        return <EditProfile id={pages.EDIT_PROFILE} state={state} />;
      case pages.VK_PHOTOS:
        return <VkPhotos id={pages.VK_PHOTOS} state={state} />;
      case pages.SELECT_COUNTRY:
        return <SelectCountry id={pages.SELECT_COUNTRY} state={state} />;
      case pages.SELECT_CITY:
        return <SelectCity id={pages.SELECT_CITY} state={state} />;
      case pages.JOIN_STEP1:
        return <JoinStep1 id={pages.JOIN_STEP1} state={state} />;
      case pages.JOIN_STEP2:
        return <JoinStep2 id={pages.JOIN_STEP2} state={state} />;
      case pages.JOIN_STEP3:
        return <JoinStep3 id={pages.JOIN_STEP3} state={state} />;
      case pages.STATS:
        return <Stats id={pages.STATS} state={state} />;
      case pages.MODER:
        return <Moder id={pages.MODER} state={state} />;
      case pages.MODER_STATS:
        return <ModerStats id={pages.MODER_STATS} state={state} />;
      case pages.NOTIFY:
        return <Notify id={pages.NOTIFY} state={state} />;
      case pages.GIFTS:
        return <Gifts id={pages.GIFTS} state={state} />;
      case pages.GIFT_SEND:
        return <GiftSend id={pages.GIFT_SEND} state={state} />;
      case pages.PREMIUM:
        return <Premium id={pages.PREMIUM} state={state} />;
      case pages.INVITES:
        return <Invites id={pages.INVITES} state={state} />;
      case pages.EDIT_EXTRA_INFO:
        return <EditExtraInfo id={pages.EDIT_EXTRA_INFO} state={state} />;
      default:
        return false;
    }
  }
}

const AppContainer = connect((state) => {
  return { state };
})(App);

export default AppContainer;

