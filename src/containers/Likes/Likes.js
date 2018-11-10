import './Likes.css';

import React from 'react';
import { Panel, PanelHeader, Spinner, Input, Select, SelectMimicry, FixedLayout, Button, Textarea } from '@vkontakte/vkui';
import * as actions from '../../actions/index';
import * as activityActions from '../../actions/activity';
import * as utils from '../../utils/index';
import * as pages from "../../constants/pages";
import BaseComponent from '../../BaseComponent';
import UICloseButton from '../../components/UI/UICloseButton';

export default class Likes extends BaseComponent {
  render() {
    return (
      <Panel id={this.props.id}>
        <PanelHeader
          left={<UICloseButton />}
        >
          Лайки
        </PanelHeader>
        {this._renderLikes()}
        {this._renderLoadMoreButton()}
      </Panel>
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
            <div className="Likes__user-row__name">{like.user.name}</div>
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
}
