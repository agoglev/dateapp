import './ProfileView.css';

import React, { Component } from 'react';
import { Panel, PanelHeader, HeaderButton, Button, Gallery, IOS, platform } from '@vkontakte/vkui';
import * as actions from '../../actions/index';
import * as cardsActions from '../../actions/cards';
import * as activityActions from '../../actions/activity';
import * as utils from '../../utils/index';
import BaseComponent from '../../BaseComponent';
import Cards from '../Main/Cards';
import * as pages from "../../constants/pages";
import Icon24Message from '@vkontakte/icons/dist/24/message';

export default class ProfileView extends BaseComponent {
  render() {
    const user = this.data.user || {};

    let nameComponents = [user.name];
    if (user.age_ts) {
      nameComponents.push(utils.getUsrAge(user.age_ts));
    }

    const slideHeight = window.innerWidth * 1.45;
    return (
      <Panel id={this.props.id} theme="white">
        <div className="profile_view">
          <div className="profile_view_photos_arrow prev" />
          <div className="profile_view_photos_arrow next" />
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
          <div className="profile_view_hide" onClick={() => window.history.back()} />
          <div className="profile_view_info">
            <div className="profile_view_name">{nameComponents.join(', ')}</div>
            <div className="profile_view_info_rows">
              {this._renderInfo()}
            </div>
            <div className="profile_view_about">{user.about}</div>
            {this.data.fromLikes === true && <div className="profile_view_actions_info">Нажмите на сердечко, чтобы создать чат!</div>}
            <div className="profile_view_buttons">
              {this._renderButtons()}
            </div>
          </div>
          {this._renderFooter()}
        </div>
      </Panel>
    )
  }

  _renderButtons() {
    const user = this.data.user || {};
    if (user.id === this.props.state.userId) {
      return null;
    }

    return (
      <div className="profile_view_button" onClick={this._reportButtonDidPress}>Пожаловаться</div>
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

  _renderFooter() {
    const user = this.data.user;
    if (user.id === this.props.state.userId || this.data.fromHistory === true) {
      return null;
    }
    const isFromCards = this.data.fromCards === true;
    const isFromSearch = this.data.fromSearch === true;
    return (
      <div className="profile_view_footer">
        {isFromCards && <div className="profile_view_footer_item dislike" onClick={this._footerDislikeButtonDidPress} />}
        {this.data.isLiked && <div className="profile_view_footer_item message" onClick={this._footerMessageButtonDidPress}><Icon24Message /></div>}
        {!this.data.isLiked && <div className="profile_view_footer_item like" onClick={this._footerLikeButtonDidPress} />}
      </div>
    )
  }

  _reportButtonDidPress = () => {
    const user = this.data.user || {};
    actions.loaderShow();
    cardsActions.report(user.id).then(() => {
      actions.loaderSuccess();
      window.history.back();
    }).catch(() => {
      actions.loaderHide();
      actions.showError('Произошла ошибка');
    });
  };

  _footerDislikeButtonDidPress = () => {
    if (this.data.fromLikes === true) {
      actions.loaderShow();
      activityActions.likeAction(this.data.user.id, 'dislike')
        .then(() => {
          window.history.back();
          actions.loaderSuccess();
          utils.statReachGoal('dislike');
        }).catch(() => {
          actions.loaderHide();
          actions.showError('Произошла ошибка');
        });
    } else {
      window.history.back();
      setTimeout(() => {
        Cards.shared._dislikeButtonDidPress();
      }, 450);
    }
  };

  _footerLikeButtonDidPress = () => {
    const isFeature = this.data.fromFeature === true;
    const isSearch = this.data.fromSearch === true;
    if (this.data.fromLikes === true || isFeature || isSearch) {
      actions.loaderShow();
      activityActions.likeAction(this.data.user.id, 'like', isFeature || isSearch)
        .then(() => {
          if (isSearch) {
            actions.loaderHide();
          } else {
            window.history.back();
          }

          if (isFeature) {
            actions.loaderHide();
            actions.showAlert('Лайк поставлен!', 'Дождитесь взаимного лайка, чтобы начать общаться.', 'Ок', {
              skipCancelButton: true
            });
            utils.statReachGoal('feature_like');
          } else if (isSearch) {
            this.setData('isLiked', true);
          } else {
            actions.loaderSuccess();
            utils.statReachGoal('like');
          }
        }).catch(() => {
          actions.loaderHide();
          actions.showError('Произошла ошибка');
        });
    } else {
      window.history.back();
      setTimeout(() => {
        Cards.shared._likeButtonDidPress();
      }, 450);
    }
  };

  _footerMessageButtonDidPress = () => {
    actions.openChat(this.data.user.id);
  };
}
