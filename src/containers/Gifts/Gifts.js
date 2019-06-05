import './Gifts.css';

import React from 'react';
import BaseComponent from '../../BaseComponent';
import Header from '../../components/proxy/Header';
import { Panel } from '@vkontakte/vkui';
import UICloseButton from '../../components/UI/UICloseButton';
import * as actions from '../../actions';

export default class Gifts extends BaseComponent {
  render() {
    if (window.isDesktop) {
      return this._renderWrap();
    }

    return (
      <Panel id={this.props.id}>
        {this._renderWrap()}
      </Panel>
    )
  }

  _renderWrap() {
    return (
      <div>
        <Header
          left={<UICloseButton/>}
        >
          Выберите подарок
        </Header>
        <div className="Gifts__items">
          {this._renderGifts()}
        </div>
      </div>
    )
  }

  _renderGifts() {
    return this.props.state.gifts.filter((gift) => gift.available).map((gift) => {
      return (
        <div
          key={gift.id}
          className="Gifts__item"
          onClick={() => actions.openGiftSend(this.data.userId, gift, this.data.target)}
        >
          <div className="Gifts__item__img" style={{backgroundImage: `url(${gift.url})`}} />
        </div>
      )
    });
  }
}
