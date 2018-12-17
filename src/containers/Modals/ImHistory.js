import React, { Component } from 'react';
import { Panel, PanelHeader, HeaderContext, Button, Spinner, List, Cell, PanelHeaderContent } from '@vkontakte/vkui';
import ReactDOM from 'react-dom';
import * as activityActions from '../../actions/activity';
import * as utils from '../../utils';
import BaseComponent from '../../BaseComponent';
import * as giftsActions from '../../actions/gifts';
import * as actions from '../../actions';
import * as pages from '../../constants/pages';

import {SystemMessageType} from "../../actions/activity";
import {markAsSeen} from "../../actions/activity";
import UIBackButton from '../../components/UI/UIBackButton';

import Icon24User from '@vkontakte/icons/dist/24/user';
import Icon24Delete from '@vkontakte/icons/dist/24/delete';
import Icon24Block from '@vkontakte/icons/dist/24/do_not_disturb';
import Icon16Dropdown from '@vkontakte/icons/dist/16/dropdown';

import Header from '../../components/proxy/Header';

export default class ImHistory extends BaseComponent {
  constructor(props) {
    super(props);

    this.peerId = parseInt(this.data.peerId, 10);

    this.state = {
      isLoading: false,
      isFailed: false,
      hasText: false,
      hasFocus: false,
      contextOpened: false
    };
  }

  componentDidMount() {
    if (this.data.isFirstShow) {
      this.setState({isLoading: true, isFailed: false});
      setTimeout(this._load, 600);
    }

    const sendBtn = ReactDOM.findDOMNode(this.refs['sendBtn']);
    if (sendBtn) {
      sendBtn.addEventListener('touchstart', this._send);
      sendBtn.addEventListener('mousedown', this._send);
    }
  }

  componentWillUnmount() {
    activityActions.markAsSeen(this.peerId);

    const sendBtn = ReactDOM.findDOMNode(this.refs['sendBtn']);
    if (sendBtn) {
      sendBtn.removeEventListener('touchstart', this._send);
      sendBtn.removeEventListener('mousedown', this._send);
    }
  }

  render() {
    if (window.isDesktop) {
      return (
        <div>
          {this._renderContnet()}
        </div>
      )
    }

    return (
      <Panel id={this.props.id} theme="white">
        {this._renderContnet()}
      </Panel>
    )
  }

  _renderContnet() {
    let peer;
    let isLoading;
    if (this.props.state.usersInfo[this.peerId]) {
      peer = this.props.state.usersInfo[this.peerId];
      isLoading = false;
    } else {
      peer = {name: 'Loading..'};
      isLoading = true;
    }

    return (
      <div>
        <Header
          left={<UIBackButton />}
        >
          {isLoading ? 'Loading..' : <PanelHeaderContent aside={<Icon16Dropdown />} onClick={this.toggleContext}>
            {peer.name}
          </PanelHeaderContent>}
        </Header>
        <HeaderContext opened={this.state.contextOpened} onClose={this.toggleContext}>
          <List>
            <Cell
              before={<Icon24User />}
              onClick={this._showProfile}
            >
              Открыть профиль
            </Cell>
            <Cell
              before={<Icon24Delete />}
              onClick={this._deleteHistory}
            >
              Удалить переписку
            </Cell>
            <Cell
              before={<Icon24Block />}
              onClick={this._toggleBan}
            >
              {this.data.isBanned ? 'Разблокировать' : 'Заблокировать'}
            </Cell>
          </List>
        </HeaderContext>
        <div className="im_history_cont">
          <div className="im_history">
            {this._renderHistory()}
            {this._renderOnline()}
          </div>
        </div>

        {this._renderSendForm()}
      </div>
    )
  }

  _renderSendForm() {
    let peer = {};
    if (this.props.state.usersInfo[this.peerId]) {
      peer = this.props.state.usersInfo[this.peerId];
    }

    if (peer.banned) {
      return null;
    }

    const sendBtnClassName = utils.classNames({
      im_send_form_button: true,
      active: this.state.hasText
    });

    const formClassName = utils.classNames({
      im_send_form: true,
      is_focused: this.state.hasFocus
    });

    return (
      <div className={formClassName}>
        <div className="im_send_form_cont">
              <textarea
                ref="input"
                className="im_send_form_text_area"
                placeholder="Ваше сообщение…"
                onChange={this._formValueChanged}
                onKeyDown={this._formKeyUp}
                onFocus={() => {
                  this.setState({hasFocus: true});
                  setTimeout(() => ImHistory.scrollToBottom(), 500);
                }}
                onBlur={() => {
                  this.setState({hasFocus: false});
                  setTimeout(() => ImHistory.scrollToBottom(), 200);
                }}
              />
          <div className="im_send_form_buttons">
            <div className="im_send_photo_button">
              <input type="file" onChange={this._photoDidSelect}/>
            </div>
            <div className={sendBtnClassName} ref="sendBtn">Отправить</div>
          </div>
        </div>
      </div>
    )
  }

  _renderHistory() {
    if (this.state.isLoading) {
      return <div className="Activity__loader"><Spinner/></div>;
    }

    if (this.state.isFailed) {
      return <div className="Activity__failed">
        <div className="Activity__failed_msg">Произошла ошибка</div>
        <Button size="l" onClick={this._load}>Повторить</Button>
      </div>;
    }

    const state = this.props.state;
    let groups = [];
    let lastTimeKey = null;

    const messages = this.props.state.imHistory[this.peerId] || [];
    if (!messages.length) {
      return <div className="Activity__failed">
        <div className="Activity__failed_msg">Нет сообщений</div>
      </div>;
    }

    if (state.usersInfo[this.peerId].banned) {
      return <div className="Activity__failed">
        <div className="Activity__failed_msg">Пользователь заблокирован</div>
      </div>;
    }

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const date = new Date(message.add_date);
      const timeKey = `${date.getDate()}_${date.getMonth()}_${date.getFullYear()}`;

      if (timeKey === lastTimeKey) {
        groups[groups.length - 1].items.push(message);
      } else {
        lastTimeKey = timeKey;
        groups.push({
          key: timeKey,
          date,
          items: [message]
        });
      }
    }

    return groups.map(group => {
      return (
        <div key={group.key}>
          <div className="im_date">{utils.dateFormatShort(group.date)}</div>
          <div>{this._renderMessages(group.items)}</div>
        </div>
      )
    });
  }

  _renderMessages(messages) {
    const state = this.props.state;
    const user = state.usersInfo[state.userId];
    const peer = state.usersInfo[this.peerId];

    return messages.map((message) => {

      if (message.system === SystemMessageType.match) {
        const caption = utils.genderText(peer.gender, [
          `{name} лайкнул вас, а вы лайкнули его`,
          `{name} лайкнула вас, а вы лайкнули её`
        ]).replace('{name}', peer.name).replace('<br/>', "\n");
        return (
          <div className="im_history_match" key={message.id}>
            <div className="im_history_match_icons">
              <div className="im_history_match_icon" style={{backgroundImage: `url(${peer.small_photo})`}} />
              <div className="im_history_match_icon" style={{backgroundImage: `url(${user.small_photo})`}} />
              <div className="im_history_match_heart" />
            </div>
            <div className="im_history_match_title">Вы понравились друг другу</div>
            <div className="im_history_match_caption">{caption}</div>
          </div>
        )
      }

      const date = new Date(message.add_date);

      let hours = date.getHours();
      if (hours < 10) {
        hours = '0' + hours;
      }

      let minutes = date.getMinutes();
      if (minutes < 10) {
        minutes = '0' + minutes;
      }
      const time = (hours + ':' + minutes);

      let text = message.text;

      let hasGift = false;
      let hasPhoto = false;
      if (message.system === SystemMessageType.gift || message.kludges.gift_id > 0) {
        hasGift = true;
        const gift = giftsActions.getGiftById(message.kludges.gift_id);
        text = <div className="im_history_gift">
          <div className="im_history_gift_image" style={{backgroundImage: `url(${gift.url})`}} />
          <div className="im_history_gift_info">Подарок</div>
          <div className="im_history_gift_text">{message.text}</div>
        </div>
      } else if (message.kludges.photo_url) {
        hasPhoto = true;
        const { photo_url, photo_width, photo_height } = message.kludges;
        text = <div className="im_history_photo" style={{width: `${photo_width}px`}}>
          <div className="im_history_photo_helper"
               style={{paddingTop: `${photo_height / photo_width * 100}%`, backgroundImage: `url(${photo_url}`}} />
        </div>
      }

      const className = utils.classNames({
        im_message_wrap: true,
        sending: message.isSending,
        inbox: message.inbox,
        gift: hasGift,
        photo: hasPhoto,
        failed: message.isFailed,
        unread: message.unread
      });

      return (
        <div className={className} key={message.id} onClick={() => this._messageDidPress(message)}>
          <div className="im_message">
            {text}
          </div>
          <div className="im_message_date">{time}</div>
          <div className="im_message_unread_indicator" />
        </div>
      )
    });
  }

  toggleContext = () => {
    this.setState({ contextOpened: !this.state.contextOpened });
  };

  _formValueChanged = (e) => {
    const val = e.target.value.trim();
    this.setState({
      hasText: val.length > 0
    });
  };

  _formKeyUp = (e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
      this._send(e);
    }
  };

  _send = (e) => {
    utils.cancelEvent(e);
    const text = this.refs['input'].value.trim();
    if (!text.length) {
      return;
    }

    this.refs['input'].value = '';
    this.setState({
      hasText: false
    });

    activityActions.sendMessage(this.peerId, text);
    ImHistory.scrollToBottom();
  };

  static scrollToBottom(fast) {
    const fn = () => {
      if (window.isDesktop) {
       const el = document.querySelector('.App__modal__cont');
       el.scrollTop = el.scrollHeight;
      } else {
        window.scrollBy(0, document.body.scrollHeight);
      }
    };
    if (fast) {
      fn();
    } else {
      setTimeout(fn);
    }
  }

  _messageDidPress(message) {
    if (message.isFailed) {
      activityActions.retrySendMessage(this.peerId, message);
    }
  }

  _load = () => {
    this.setState({isLoading: true, isFailed: false});
    activityActions.loadHistory(this.peerId)
      .then(() => {
        this.setState({isLoading: false}, () => {
          ImHistory.scrollToBottom(true);
          ImHistory.scrollToBottom();
        });

        setTimeout(() => {
          markAsSeen(this.peerId);
        }, 2000);

        this.setData('isFirstShow', false);
      }).catch(() => {
      this.setState({isLoading: false, isFailed: true});
    });
  };

  _photoDidSelect = (e) => {
    const [file] = e.target.files;
    utils.proccessImage(file).then((photo) => {
      activityActions.sendPhotoMessage(this.peerId, photo);
      ImHistory.scrollToBottom(true);
    });
  };

  _showProfile = () => {
      const user = this.props.state.usersInfo[this.peerId];
      this.setState({contextOpened: false});
      actions.go(pages.PROFILE, {
        user,
        fromLikes: false,
        fromHistory: true
      })
  };

  _deleteHistory = () => {
    this.setState({contextOpened: false});
    actions.showAlert('Удаление переписки', 'Удалив историю сообщений, вы больше не сможете найти данного пользователя. Все равно удалить?', 'Да, удалить', {
      okStyle: 'destructive'
    }).then(() => {
        actions.loaderShow();
        activityActions.clearHistory(this.peerId).then(() => {
          window.history.back();
          actions.loaderSuccess();
        }).catch(() => actions.showError('Проишла ошибка'));
      });
  };

  _toggleBan = () => {
    actions.loaderShow();
    activityActions.toggleBan(this.peerId).then(() => {
      this.setState({contextOpened: false});
      actions.loaderSuccess();
    }).catch(actions.showError);
  };

  _renderOnline() {
    const peer = this.props.state.usersInfo[this.peerId];
    const now = Math.floor(new Date().getTime() / 1000);

    if (now - peer.last_update < 60 * 10) {
      return <div className="Activity__im-history__online">Онлайн</div>;
    }

    return null;
  }
}
