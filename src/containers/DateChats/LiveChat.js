import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Panel, Group, PanelHeader, Button, Gallery, Spinner, Input, Div, CellButton } from '@vkontakte/vkui';
import * as actions from '../../actions/index';
import * as liveChatsActions from "../../actions/live_chats";
import BaseComponent from '../../BaseComponent';
import * as api from '../../services/api';
import UICloseButton from '../../components/UI/UICloseButton';
import * as utils from "../../utils";
import * as pages from "../../constants/pages";

const Rates = {
  1: 5,
  2: 13,
  3: 30
};

export default class LiveChat extends BaseComponent {
  constructor() {
    super();

    this.state = {
      message: ''
    };
  }

  componentDidMount() {
    document.addEventListener('touchstart', this._touchDidStart);
  }

  componentWillUnmount() {
    document.removeEventListener('touchstart', this._touchDidStart);
    liveChatsActions.leaveChat();
  }

  render() {
    return (
      <Panel id={this.props.id}>
        <PanelHeader
          left={<UICloseButton text="Закрыть" />}
        >
          Чат
        </PanelHeader>
        {this.data.isLoading && this._renderWaiting()}
        {!this.data.isLoading && this._renderChat()}
      </Panel>
    )
  }

  _renderWaiting() {
    const message = this.data.isConnecting ? 'Подключение..' : 'Поиск собеседника..';
    return (
      <div className="LiveChat__waiting">
        <Spinner />
        <div className="LiveChat__waiting__title">{message}</div>
      </div>
    )
  }

  _renderEnded() {
    const state = this.props.state;
    const text = state.usersInfo[state.userId].gender === 1 ? "Ваш собеседник покинул чат" : <div>Ваш собеседник покинул чат. Еще доступно чатов: <b>{this.data.availChats}</b></div>;
    return (
      <div className="LiveChat__waiting">
        <div className="LiveChat__waiting__title">{text}</div>
        <div className="LiveChat__waiting__button"><Button onClick={liveChatsActions.loadChat}>Продолжить</Button></div>
      </div>
    )
  }

  _renderNeedPay() {
    return (
      <div className="LiveChat__waiting">
        <div className="LiveChat__waiting__title">Создать следующий чат вы сможете сегодня в <b>00:00 по мск</b></div>
        <div className="LiveChat__waiting__or">или</div>
        <div className="LiveChat__waiting__payments">
          <CellButton onClick={() => this._moreChats(1)}>Еще {Rates[1]} чатов за 3 голоса</CellButton>
          <CellButton onClick={() => this._moreChats(2)}>Еще {Rates[2]} чатов за 6 голосов</CellButton>
          <CellButton onClick={() => this._moreChats(3)}>Еще {Rates[3]} чатов за 12 голосов</CellButton>
        </div>
      </div>
    )
  }

  _renderChat() {
    if (this.data.isNeedPay) {
      return this._renderNeedPay();
    }

    if (this.data.isEnded) {
      return this._renderEnded();
    }

    const user = this.data.user;
    const slideHeight = window.innerWidth * 1.2;

    let nameComponents = [user.name];
    if (user.age_ts) {
      nameComponents.push(utils.getUsrAge(user.age_ts));
    }

    return (
      <div>
        <Group>
          <div className="profile_view_photos_wrap">
            <Gallery
              slideWidth="100%"
              align="center"
              style={{ height: slideHeight }}
              bullets="light"
            >
              {this._renderPhotos()}
            </Gallery>
          </div>
          <div className="profile_view_info" style={{marginBottom: 0}}>
            <div className="profile_view_name">{nameComponents.join(', ')}</div>
            <div className="profile_view_info_rows">
              {this._renderInfo()}
            </div>
            <div className="profile_view_about">{user.about}</div>
            <div className="LiveChat__actions">
              <div className="LiveChat__action">
                <Button size="l" stretched level="secondary" onClick={this._skipButtonDidPress}>
                  {this.data.isLiked ? "Продолжить поиск" : "Пропустить"}
                </Button>
              </div>
              {!this.data.isLiked && <div className="LiveChat__action"><Button size="l" stretched onClick={this._likeButtonDidPress}>Лайк</Button></div>}
            </div>
          </div>
        </Group>
        <Group title="Переписка">
          <div className="LiveChat__messages">
            {this._renderMessages()}
          </div>
        </Group>
        <Group>
          <Div>
            <Input
              type="text"
              placeholder="Ваше сообщение.."
              value={this.state.message}
              onChange={(e) => this.setState({message: e.target.value})}
            />
            <div className="LiveChat__send-button-wrap">
              <div
                className="ui_inline_button fill"
              >Отправить</div>
            </div>
          </Div>
        </Group>
      </div>
    )
  }

  _renderInfo() {
    const user = this.data.user || {};

    let rows = [];

    if (user['country_name'] || user['city_name']) {
      rows.push({
        type: 'geo',
        value: [user['country_name'], user['city_name']].filter((row) => String(row).length > 0).join(', ')
      });
    }

    if (user['job']) {
      rows.push({
        type: 'job',
        value: user['job']
      });
    }

    if (user['education']) {
      rows.push({
        type: 'education',
        value: user['education']
      });
    }

    return rows.map((row) => {
      const className = utils.classNames({
        profile_view_info_row: true,
        [row.type]: true
      });
      return (
        <div className={className} key={row.type}>{row.value}</div>
      )
    });
  }

  _renderPhotos() {
    const user = this.data.user || {photos: []};
    return user.photos.map((photo, i) => {
      return (
        <div key={i} className="profile_view_photo" style={{backgroundImage: `url(${photo.photo400})`}} />
      )
    });
  }

  _renderMessages() {
    if (!this.data.messages.length) {
      return (
        <div className="LiveChat__message__empty">Напишите здесь первым!</div>
      )
    }
    return this.data.messages.map((message, i) => {
      const className = utils.classNames({
        LiveChat__message: true,
        outbox: message.isOutBox
      });

      let cont;
      if (message.type === 'like') {
        let txt;
        if (this.data.isLiked) {
          txt = `Вы понравились друг другу с ${this.data.user.name}, вы сможете продолжить беседу в разделе сообщений!`;
        } else {
          txt = utils.genderText(this.data.user.gender, [
            '{name} поставил Вам лайк, поставьте взаимный лайк, если хотите создать постоянный чат!',
            '{name} поставила Вам лайк, поставьте взаимный лайк, если хотите создать постоянный чат!'
          ]).replace('{name}', this.data.user.name);
        }

        cont = <div className="LiveChat__message__system">{txt}</div>;
      } else {
        cont = <div className="LiveChat__message__text">{message.text}</div>;
      }

      return (
        <div className={className} key={i}>
          {cont}
        </div>
      )
    });
  }

  _sendButtonDidPress = () => {
    const text = this.state.message.trim();
    if (!text.length) {
      return actions.showError('Введите текст сообщения');
    }

    actions.loaderShow();
    liveChatsActions.sendMessage(text).then(() => {
      actions.loaderHide();
      this.setState({message: ''});
    }).catch(() => actions.showError());
  };

  _skipButtonDidPress = () => {
    liveChatsActions.seen();
    liveChatsActions.leaveChat();
    liveChatsActions.loadChat();
  };

  _likeButtonDidPress = () => {
    liveChatsActions.like();
  };

  _moreChats = (rateId) => {
    actions.loaderShow();
    api.showOrderBox(`live_chats${rateId}`).then(() => {
      actions.loaderSuccess();
      const curCount = this.data.availChats || 0;
      actions.setData('waitForPay', true, pages.LIVE_CHAT);
      actions.setData('availChats', curCount + Rates[rateId], pages.LIVE_CHAT);
      liveChatsActions.loadChat();
    }).catch((isFailed) => {
      if (isFailed) {
        actions.showError();
      } else {
        actions.loaderHide();
      }
    });
  };

  _touchDidStart = (e) => {
    if (e.target.classList.contains('ui_inline_button')) {
      e.preventDefault();
      this._sendButtonDidPress();
    }
  };
}
