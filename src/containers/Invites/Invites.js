import './Invites.css';

import React from 'react';
import BaseComponent from '../../BaseComponent';
import Header from '../../components/proxy/Header';
import * as UI from '@vkontakte/vkui';
import UICloseButton from '../../components/UI/UICloseButton';
import * as actions from '../../actions';
import * as utils from '../../utils';
import connect from '@vkontakte/vkui-connect';
import * as accountActions from '../../actions/account';
import * as activityActions from "../../actions/activity";
import {setPremiumState} from "../../actions/payments";

export default class Invites extends BaseComponent {
  render() {
    if (window.isDesktop) {
      return this._renderWrap();
    }

    return (
      <UI.Panel id={this.props.id}>
        {this._renderWrap()}
      </UI.Panel>
    )
  }

  _renderWrap() {
    return (
      <div>
        <Header
          left={<UICloseButton/>}
        >
          Приглашения
        </Header>
        {this._renderCont()}
      </div>
    )
  }

  _renderCont() {
    if (this.data.isLoading && this.data.points === null) {
      return <div className="Activity__loader"><UI.Spinner/></div>;
    }

    if (this.data.isFailed) {
      return <div className="Activity__failed">
        <div className="Activity__failed_msg">Произошла ошибка</div>
        <UI.Button size="l" onClick={this._load}>Повторить</UI.Button>
      </div>;
    }


    const points = parseInt(this.data.points, 10);
    return (
      <UI.PullToRefresh onRefresh={this._load} isFetching={this.data.isLoading}>
        <div>
          <UI.Group description="Приглашайте друзей, чтобы зарабатывать баллы, 1 друг зарегистрированный по вашей ссылке — 1 балл">
            <UI.Div>
              <div className="Invites__points">
                <div className="Invites__points-count">{points}</div>
                <div className="Invites__points-caption">{utils.gram(points, ['балл', 'балла', 'баллов'], true)}</div>
              </div>
              <div className="Invites__link" onClick={this._copyLink}>
                <div className="Invites__link-title">Ваша ссылка:</div>
                <div className="Invites__link-value">https://vk.com/app6682509#ref={this.props.state.userId}</div>
              </div>
              <div className="Invites__button">
                <UI.Button onClick={this._inviteDidPress}>Пригласить друзей</UI.Button>
              </div>
            </UI.Div>
          </UI.Group>
          {this._renderProducts()}
          {this._renderFriends()}
        </div>
      </UI.PullToRefresh>
    )
  }

  _renderProducts() {
    let products = [];
    for (let i in this.data.products) {
      const product = this.data.products[i];
      products.push(
        <UI.Cell
          key={i}
          indicator={utils.gram(product.price, ['балл', 'балла', 'баллов'])}
          onClick={() => this._productDidPress(i, product)}
        >{product.title}</UI.Cell>);
    }

    return (
      <UI.Group title="Потратить баллы">
        <UI.List>
          {products}
        </UI.List>
      </UI.Group>
    )
  }

  _renderFriends() {
    let users;
    if (!this.data.users || this.data.users.length === 0) {
      users = <div className="Likes__empty">По вашей ссылке никто не зарегистрировался</div>;
    } else {
      users = this.data.users.map((user) => {
        return (
          <UI.Cell
            key={user.id}
            before={<UI.Avatar src={user.small_photo} />}
            onClick={() => actions.openProfile(user)}
          >{user.name}</UI.Cell>
        )
      });
    }

    return (
      <UI.Group title="Последние приглашенные друзья">
        <UI.List>
          {users}
        </UI.List>
      </UI.Group>
    )
  }

  _copyLink = () => {
    utils.copyToClipboard(`https://vk.com/app6682509#ref=${this.props.state.userId}`);
    actions.showAlert('Информация', 'Ссылка скопирована!', 'OK', {
      skipCancelButton: true
    });
  };

  _inviteDidPress = () => {
    connect.send('VKWebAppShare', {message: 'Найдите свою вторую половинку в приложении ВКонтакте! 😍', link: `https://vk.com/app6682509#ref=${this.props.state.userId}`});
  };

  _load = () => {
    accountActions.loadInvites();
  };

  _productDidPress = (type, info) => {
    const points = parseInt(this.data.points, 10);

    if (points < info.price) {
      return actions.showAlert('Не хватает баллов', <span>Для покупки «{info.title}» необходимо <b>{utils.gram(info.price, ['балл', 'балла', 'баллов'])}</b></span>, 'OK', {
        skipCancelButton: true
      });
    }

    actions.loaderShow();
    accountActions.invitesBuyProduct(type)
      .then(() => {
        actions.loaderSuccess();

        switch (type) {
          case 'feature':
            activityActions.loadFeaturedUsers();
            break;
          case 'premium_day':
            setPremiumState(true);
            break;
        }
      })
      .catch((err) => actions.showError(err.message));
  };
}
