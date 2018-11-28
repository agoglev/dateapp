import './Likes.css';

import React from 'react';
import { Panel, Spinner, Button } from '@vkontakte/vkui';
import * as actions from '../../actions/index';
import * as activityActions from '../../actions/activity';
import * as utils from '../../utils/index';
import * as pages from "../../constants/pages";
import BaseComponent from '../../BaseComponent';
import UICloseButton from '../../components/UI/UICloseButton';
import * as payments from '../../actions/payments';
import Header from '../../components/proxy/Header';

export default class Likes extends BaseComponent {
  render() {
    if (window.isDesktop) {
      return (
        <div>{this._renderContent()}</div>
      )
    }

    return (
      <Panel id={this.props.id}>
        {this._renderContent()}
      </Panel>
    )
  }

  _renderContent() {
    const className = utils.classNames({
      Likes__items: true,
      blur: this._isNeedPay()
    });

    return (
      <div>
        <Header
          left={<UICloseButton />}
        >
          Лайки
        </Header>
        <div className={className}>
          {this._renderLikes()}
        </div>
        {this._renderLoadMoreButton()}
        {this._renderPremium()}
      </div>
    )
  }

  _renderLikes() {
    if (this.data.isLoading) {
      return <div className="Activity__loader"><Spinner/></div>;
    }

    if (this.data.isFailed) {
      return <div className="Activity__failed">
        <div className="Activity__failed_msg">Произошла ошибка</div>
        <Button size="l" onClick={this._load}>Повторить</Button>
      </div>;
    }

    if (!this.data.likes.length) {
      return <div className="Likes__empty">Пока лайков нет</div>
    }

    return this.data.likes.map((like) => {
      const className = utils.classNames({
        Likes__user_row: true,
        unread: like.unread
      });
      return (
        <div
          className={className}
          key={like.user.id}
          onClick={() => this._likeDidPress(like)}
        >
          <div className="Likes__user-row__cont" style={{backgroundImage: `url(${like.user.small_photo})`}}>
            <div className="Likes__user-row__name-wrap">
              <div className="Likes__user-row__name">{like.user.name}</div>
            </div>
          </div>
        </div>
      )
    });
  }

  _renderLoadMoreButton() {
    if (this.data.isLoading || this.data.isFailed || !this.data.nextFrom) {
      return null;
    }

    return (
      <div className="Likes__load-more-wrap" onClick={this._loadMore}>
        <div className="Likes__load-more">{this.data.isLoadingMore ? 'Загрузка..' : 'Показать больше'}</div>
      </div>
    )
  }

  _renderPremium() {
    if (!this._isNeedPay()) {
      return null;
    }

    let label;
    if (this.data.nextFrom) {
      label = `${this.data.likes.length}+ лайков`;
    } else {
      label = utils.gram(this.data.likes.length, ['лайк', 'лайка', 'лайков']);;
    }

    utils.statReachGoal('likes_premium');

    return (
      <div className="Likes__premium">
        <div className="Likes__premium__title">У вас {label}!</div>
        <div className="Likes__premium__caption">Вам нужен Знакомства «Премиум», чтобы увидеть их.</div>
        <Button size="xl" level="1" onClick={() => payments.buyPremium()}>Получить премиум</Button>
        <div className="Likes__premium__info">За 9 голосов в месяц</div>
      </div>
    )
  }

  _load = () => {
    activityActions.loadLikes();
  };

  _loadMore = () => {
    activityActions.loadMoreLikes();
  };

  _likeDidPress = (like) => {
    actions.go(pages.PROFILE, {user: like.user, fromLikes: true});
    if (like.unread) {
      activityActions.readLike(like.user.id);
    }
  };

  _isNeedPay() {
    const state = this.props.state;
    if (state.hasPremium || this.data.isLoading || this.data.isFailed || !this.data.likes.length || !window.isDG) {
      return false;
    }

    if (state.usersInfo[state.userId].gender === 1) {
      return false;
    }

    return true;
  }
}
