import './ProfileView.css';

import React, { Component } from 'react';
import { Panel, PanelHeader, HeaderButton, Button, Gallery, IOS, platform, FormStatus } from '@vkontakte/vkui';
import * as actions from '../../actions/index';
import * as cardsActions from '../../actions/cards';
import * as activityActions from '../../actions/activity';
import * as utils from '../../utils/index';
import BaseComponent from '../../BaseComponent';
import Cards from '../Main/Cards';
import * as pages from "../../constants/pages";
import Icon24Message from '@vkontakte/icons/dist/24/message';
import * as payments from "../../actions/payments";

export default class ProfileView extends BaseComponent {
  render() {
    if (window.isDesktop) {
      return this._renderContent();
    }

    return (
      <Panel id={this.props.id} theme="white">
        {this._renderContent()}
      </Panel>
    )
  }

  _renderContent() {
    const slideHeight = window.isDesktop ? 540 : window.innerWidth * 1.45;

    return (
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
        {this._renderInfoWrap()}
        {this._renderFooter()}
      </div>
    )
  }

  _renderInfoWrap() {
    const user = this.data.user || {};

    if (user.banned || user.deleted) {
      let text;
      if (user.banned) {
        text = utils.genderText(user.gender, [
          `${user.name} заблокирован по жалобам других участников`,
          `${user.name} заблокирована по жалобам других участников`
        ]);
      } else {
        text = utils.genderText(user.gender, [
          `${user.name} удалил свою анкету`,
          `${user.name} удалила свою анкету`
        ]);
      }
      return (
        <div className="profile_view_deactivated">{text}</div>
      )
    }

    let nameComponents = [user.name];
    if (user.age_ts) {
      nameComponents.push(utils.getUsrAge(user.age_ts));
    }

    const favBtnClassName = utils.classNames({
      profile_view_fav_btn: true,
      unfav: this.data.isFavorite
    });

    return (
      <div className="profile_view_info">
        {user.id !== this.props.state.userId && <div className={favBtnClassName} onClick={this._favButtonDidPress} />}
        <div className="profile_view_name">{nameComponents.join(', ')}</div>
        <div className="profile_view_info_rows">
          {this._renderInfo()}
        </div>
        <div className="profile_view_about">{user.about}</div>
        {this._renderExtraInfo()}
        {this.data.fromLikes === true && <FormStatus>Нажмите на сердечко, чтобы создать чат!</FormStatus>}
        <div className="profile_view_buttons">
          {this._renderButtons()}
        </div>
      </div>
    )
  }

  _renderButtons() {
    const user = this.data.user || {};
    if (user.id === this.props.state.userId) {
      return null;
    }

    if (this.data.fromFeature === true && !this.props.state.isModer) {
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
    const user = this.data.user || {};
    if (user.id === this.props.state.userId || this.data.fromHistory === true) {
      return null;
    }
    const isFromCards = this.data.fromCards === true;
    const isFromLikes = this.data.fromLikes === true;
    return (
      <div className="profile_view_footer">
        {(isFromLikes || isFromCards) && <div className="profile_view_footer_item dislike" onClick={this._footerDislikeButtonDidPress} />}
        {(utils.isPaymentsEnabled() || this.props.state.hasPremium) && ((this.data.isLiked && isFromLikes) || (!isFromLikes)) && <div className="profile_view_footer_item message" onClick={this._footerMessageButtonDidPress}><Icon24Message /></div>}
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
    if (this.props.state.hasPremium || this.data.fromLikes === true) {
      actions.openChat(this.data.user.id);
    } else {
      payments.showSkipMathcBox(this.data.user);
    }
  };

  _favButtonDidPress = () => {
    actions.loaderShow();
    activityActions.toggleFav(this.data.user.id, this.data.isFavorite ? 0 : 1).then(() => {
      actions.loaderSuccess();
      this.setData({isFavorite: !this.data.isFavorite});
    }).catch((err) => actions.showError(err.message));
  };

  _renderExtraInfo() {
    const extra = this.data.extra || {};
    const maps = this._renderMapExtraInfo();

    let items = [];
    if (extra.children > 0) {
      items.push(['Дети', maps.children[extra.children]]);
    }
    if (extra.gender > 0) {
      items.push(['Ориентация', maps.gender[extra.gender]]);
    }
    if (extra.relations > 0) {
      items.push(['Отношения', maps.relations[extra.relations]]);
    }
    if (extra.home > 0) {
      items.push(['Я живу', maps.home[extra.home]]);
    }
    if (extra.alcohol > 0) {
      items.push(['Алкоголь', maps.alcohol[extra.alcohol]]);
    }

    return (
      <div className="profile_view_extra_info_items">
        {items.map(([label, value], i) => {
          return <div className="profile_view_extra_info_item" key={i}>
            <div className="profile_view_extra_info_item_label">{label}:</div>
            <div className="profile_view_extra_info_item_value">{value}</div>
          </div>
        })}
      </div>
    )
  }

  _renderMapExtraInfo() {
    const user = this.data.user || {};
    return {
      children: {
          1: 'Уже взрослые',
          2: 'Уже есть',
          3: 'Нет, никогда',
          4: 'Когда-нибудь',
      },
      alcohol: {
        1: 'Выпиваю в компании',
        2: 'Не пью',
        3: 'Не приемлю',
        4: 'Много пью'
      },
      home: {
        1: 'Отдельно',
        2: 'В общежитии',
        3: 'С родителями',
        4: 'Со второй половиной',
        5: 'С соедями'
      },
      relations: {
        1: 'Все сложно',
        2: user.gender === 1 ? 'Свободна' : 'Свободен',
        3: user.gender === 1 ? 'Занята' : 'Занят',
      },
      gender: {
        1: 'Би',
        2: user.gender === 1 ? 'Лесби' : 'Гей',
        3: 'Спросите меня',
        4: 'Гетеро',
      },
      smoke: {
        1: user.gender === 1 ? 'Заядлая курильщица' : 'Заядлый курильщик',
        2: 'Категорически против курения',
        3: 'Не курю',
        4: 'Курю за компанию',
        5: 'Курю время от времени'
      }
    };
  }
}
