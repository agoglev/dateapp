import './Activity.css';

import React, { Component } from 'react';
import { PanelHeader, Button, Spinner, Group, Header, HorizontalScroll } from '@vkontakte/vkui';
import * as actions from '../../actions';
import * as activityActions from '../../actions/activity';
import * as accountActions from '../../actions/account';
import * as utils from '../../utils';
import * as pages from '../../constants/pages';

export default class Activity extends Component {
  constructor() {
    super();

    this.state = {
      isLoading: false,
      isFailed: false
    };
  }

  componentDidMount() {
    this._load();
    this.refs['wrap'].style.paddingBottom = (utils.getTabBarHeight() + 16) + 'px';
    accountActions.resetBadge();
  }

  render() {
    return (
      <div ref="wrap">
        <PanelHeader>
          Активность
        </PanelHeader>
        {this._renderLikes()}
        <Group>
          <div className="im_dialogs">
            {this._renderDialogs()}
          </div>
        </Group>
      </div>
    )
  }

  _renderDialogs() {
    const dialogs = this.props.state.dialogs;

    if (this.state.isLoading && dialogs.length === 0) {
      return <div className="Activity__loader"><Spinner/></div>;
    }

    if (this.state.isFailed) {
      return <div className="Activity__failed">
        <div className="Activity__failed_msg">Произошла ошибка</div>
        <Button size="l" onClick={this._load}>Повторить</Button>
      </div>;
    }


    if (dialogs.length === 0) {
      return (
        <div className="im_dialogs_empty">
          <div className="im_dialogs_empty_title">Начните поиск пар</div>
          <div className="im_dialogs_empty_caption">Вы начнёте видеть пары, как только получите первый взаимный лайк.</div>
          <Button size="l" onClick={() => actions.setTab('cards')}>Начать знакомиться</Button>
        </div>
      );
    }

    return dialogs.map((dialog) => {
      let text;
      switch (dialog.message.system) {
        case activityActions.SystemMessageType.match:
          text = <div className="im_dialog_system">Новая пара! Скажи «привет»! 👋</div>;
          break;
        case activityActions.SystemMessageType.gift:
          text = <div className="im_dialog_system">Подарок</div>;
          break;
        default:
          if (dialog.message.kludges.photo_url) {
            text = 'Фотография';
          } else {
            text = dialog.message.text;
          }
          text = (dialog.message.inbox ? '' : 'Вы: ') + text;
      }

      const user = this.props.state.usersInfo[dialog.user.id];
      return (
        <div className="im_dialog" key={dialog.id} onClick={() => actions.go(pages.IM_HISTORY, {peerId: dialog.id})}>
          <div className="im_dialog_photo" style={{backgroundImage: `url(${user.small_photo})`}} />
          <div className="im_dialog_cont">
            <div className="im_dialog_name">{user.name}</div>
            <div className="im_dialog_message">{text}</div>
          </div>
          <div className="im_dialog_badge">{dialog.badge > 0 && dialog.badge}</div>
          <div className="im_dialog_separator" />
        </div>
      )
    });
  }

  _renderLikes() {
    const likes = this.props.state.likes;

    if (likes.length === 0) {
      return null;
    }

    return (
      <Group style={{ paddingBottom: 8 }}>
        <Header level="2">Последние лайки</Header>
        <HorizontalScroll>
          <div className="likes_rows">
            {this._renderLikesRows(likes)}
          </div>
        </HorizontalScroll>
      </Group>
    )
  }

  _renderLikesRows(likes) {
    return likes.map((like) => {
      const className = utils.classNames({
        likes_row: true,
        unread: like.unread
      });
      return (
        <div
          className={className}
          key={like.user.id}
          onClick={() => actions.go(pages.PROFILE, {user: like.user, fromLikes: true})}
        >
          <div className="likes_row_photo_wrap">
            <div className="likes_row_photo" style={{backgroundImage: `url(${like.user.small_photo})`}} />
            <div className="likes_row_new_indicator" />
          </div>
          <div className="likes_row_name">{like.user.name}</div>
        </div>
      )
    });
  }

  _load = () => {
    this.setState({
      isLoading: true,
      isFailed: false
    });
    activityActions.load().then(() => {
      this.setState({
        isLoading: false
      });
    }).catch(() => {
      this.setState({
        isLoading: false,
        isFailed: true
      });
    });
  };
}
