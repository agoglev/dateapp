import './Main.css';

import React from 'react';
import BaseComponent from '../../BaseComponent';
import { Panel, PanelHeader, Div, Group, FixedLayout, Spinner } from '@vkontakte/vkui';
import * as actions from '../../actions';
import * as pages from '../../constants/pages';

import TabBar from '../../components/TabBar/TabBar'
import JoinIntro from '../Join/JoinIntro';
import Cards from './Cards';
import Activity from './Activity';
import Profile from '../Profile/Profile';
import * as utils from "../../utils";
import PlaceholderError from "../../components/Placeholder/PlaceholderError";
import DateChats from "../DateChats/DateChats";

export default class Main extends BaseComponent {
  render() {
    return (
      <Panel id={this.props.id}>
        {this._renderContent()}
        {this._renderBottom()}
      </Panel>
    )
  }

  _renderContent() {
    const state = this.props.state;

    if (!state.appInited) {
      return (
        <div className="MainLaunchLoader">
          <Spinner/>
        </div>
      )
    }

    switch (state.activeTab) {
      case 'join':
        return <JoinIntro id="join_intro" state={state} />;
      case 'cards':
        return <Cards state={state} />;
      case 'messages':
        return <Activity state={state} />;
      case 'profile':
        return <Profile state={state} />;
      case 'date_chats':
        return <DateChats state={state} />;
      case 'error':
        return <PlaceholderError />;
    }
  }

  _renderBottom() {
    const state = this.props.state;

    if (['join', 'error'].indexOf(state.activeTab) > -1 || !state.appInited) {
      return null;
    }

    return (
      <FixedLayout vertical="bottom" style={{background: '#fff'}}>
        <TabBar state={state} />
      </FixedLayout>
    )
  }
}
