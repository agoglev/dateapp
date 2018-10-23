import './css/style.css';

import React from 'react';
import { View } from '@vkontakte/vkui';
import '@vkontakte/vkui/dist/vkui.css';
import { connect } from 'react-redux';
import * as pages from './constants/pages';
import * as actions from './actions';
import * as UI from '@vkontakte/vkui';
import * as utils from './utils'

import Main from './containers/Main/Main';

import JoinStep1 from './containers/Join/JoinStep1';
import JoinStep2 from './containers/Join/JoinStep2';
import JoinStep3 from './containers/Join/JoinStep3';

import SelectCountry from './containers/Utils/SelectCountry';
import SelectCity from './containers/Utils/SelectCity';

import ImHistory from './containers/Modals/ImHistory';
import ProfileView from './containers/ProfileView/ProfileView';
import EditProfile from './containers/EditProfile/EditProfile';
import Filters from './containers/Filters/Filters';
import VkPhotos from './containers/VkPhotos/VkPhotos';

import PlaceholderDeleted from './components/Placeholder/PlaceholderDeleted';
import PlaceholderBanned from './components/Placeholder/PlaceholderBanned';
import PlaceholderNeedToken from "./components/Placeholder/PlaceholderNeedToken";
import PlaceholderWorks from "./components/Placeholder/PlaceholderWorks";

class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			fetchedUser: null,
		};
	}

	go = (e) => {
    actions.go(e.currentTarget.dataset.to);
	};

	render() {
    if (this.props.state.works === true) {
      return (
        <PlaceholderWorks />
      )
    }

    const userInfo = this.props.state.usersInfo[this.props.state.userId] || {};
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


		return (
      <div>
				{this._renderError()}
        {this._renderLoader()}
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
        <View activePanel={state.activePanels.modal} id="modal" header={this._getBaseHeader('modal')}>
          <ProfileView id={pages.PROFILE} state={state} />
          <EditProfile id={pages.EDIT_PROFILE} state={state} />
          <Filters id={pages.FILTERS} state={state} />
        </View>
        <View activePanel={state.activePanels.vk_photos} id="vk_photos" header={this._getBaseHeader('vk_photos')}>
          <VkPhotos id={pages.VK_PHOTOS} state={state} />
        </View>
        <View activePanel={state.activePanels.utils} id="utils">
          <SelectCountry id={pages.SELECT_COUNTRY} go={this.go} state={state} />
          <SelectCity id={pages.SELECT_CITY} go={this.go} state={state} />
        </View>
      </UI.Root>
    );
	}
}

const AppContainer = connect((state) => {
  return { state };
})(App);

export default AppContainer;

