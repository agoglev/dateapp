import './Gifts.css';

import React from 'react';
import BaseComponent from '../../BaseComponent';
import Header from '../../components/proxy/Header';
import { Panel, FormLayout, Textarea, Input, Button, Gallery, Avatar, Cell, FixedLayout } from '@vkontakte/vkui';
import UIBackButton from '../../components/UI/UIBackButton';
import * as utils from '../../utils';
import * as paymentsActions from '../../actions/payments';

export default class GiftSend extends BaseComponent {
  constructor() {
    super();

    this.state = {
      height: window.innerHeight - utils.getHeaderHeight()
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this._didResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._didResize);
  }

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
    const peer = this.props.state.usersInfo[this.data.userId] || {};

    return (
      <div>
        <Header
          left={<UIBackButton />}
        >
          Отправка
        </Header>
        <div className="Gifts__send_wrap" style={{minHeight: `${this.state.height}px`, paddingBottom: 77}}>
          <Gallery
            slideWidth="100%"
            align="center"
            style={{flex: 1}}
            slideIndex={this.data.slideIndex}
            onChange={slideIndex => this.setData('slideIndex', slideIndex)}
          >
            {this._renderSlides()}
          </Gallery>
          <div className="Gifts__send_price">{this._getPrice()}</div>
          <FormLayout style={{flex: '0 0 auto'}}>
            <div top="Получатель">
              <Cell before={<Avatar src={peer.small_photo} />}>{peer.name}</Cell>
            </div>
            <Textarea placeholder="Напишите сообщение" value={this.data.message} onChange={(e) => this.setData('message', e.target.value)} />
            <FixedLayout vertical="bottom" style={{backgroundColor: '#fff', position: 'relative', zIndex: 1000}}>
              <Button size="xl" level="1" onClick={this._sendButtonDidPress} style={{margin: 16}}>Отправить подарок</Button>
            </FixedLayout>
          </FormLayout>
        </div>
      </div>
    )
  }

  _renderSlides() {
    return this.props.state.gifts.filter((gift) => gift.available).map((gift) => {
      return (
        <div key={gift.id} className="Gifts__send_slide">
          <div className="Gifts__send_slide__img" style={{backgroundImage: `url(${gift.url})`}} />
        </div>
      )
    });
  }

  _getPrice() {
    const gift = this.props.state.gifts.filter((gift) => gift.available)[this.data.slideIndex];
    if (gift) {
      if (window.isDG) {
        return utils.gram(gift.priceVotes, ['голос', 'голоса', 'голосов']);
      }
      return utils.gram(gift.priceRubles, ['рубль', 'рубля', 'рублей'])
    }
    return null;
  }

  _sendButtonDidPress = () => {
    const gift = this.props.state.gifts.filter((gift) => gift.available)[this.data.slideIndex];
    const giftId = gift ? gift.id : this.data.gift.id;
    paymentsActions.buyGift(giftId, this.data.userId, this.data.message.trim(), this.data.target);
  };

  _didResize = () => {
    this.setState({
      height: window.innerHeight - utils.getHeaderHeight()
    });
  };
}
