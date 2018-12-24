import './Activity.css';

import React, { Component } from 'react';
import { Button, Spinner, Group, HorizontalScroll, Cell, HeaderButton, Tabs, TabsItem } from '@vkontakte/vkui';
import * as actions from '../../actions';
import * as activityActions from '../../actions/activity';
import * as accountActions from '../../actions/account';
import * as utils from '../../utils';
import * as pages from '../../constants/pages';
import Icon24Like from '@vkontakte/icons/dist/24/like';
import Header from '../../components/proxy/Header';
import * as payments from "../../actions/payments";
import Icon24Poll from '@vkontakte/icons/dist/24/poll';
import BaseComponent from '../../BaseComponent';

let skipFeatureAnim = false;
export default class Activity extends BaseComponent {
  constructor() {
    super();

    this.state = {
      isLoadingMore: false
    };
  }

  componentDidMount() {
    //this._load();
    this.refs['wrap'].style.paddingBottom = (utils.getTabBarHeight() + 16) + 'px';
    accountActions.resetBadge();

    utils.statReachGoal('page_activity');

    if (actions.isNeedFeatureBoxShow) {
      actions.setNeedFeatureBoxState(false);
      this._featureDidPress();
    }

    if (!window.isDG) {
      //utils.initYAActivityBlock();
    }
  }

  render() {
    return (
      <div ref="wrap">
        <Header
          left={this._renderStatsButton()}
        >
          Активность
        </Header>
        {this._renderFeatured()}
        {this._renderLikes()}
        <div id="yandex_rtb_R-A-159294-836" />
        <Group>
          {this._renderTabs()}
          {this._renderTabsContent()}
        </Group>
        {this._renderMoreButton()}
      </div>
    )
  }

  _renderTabs() {
    if ((this.data.isLoading && !this.props.state.dialogs.length) || this.data.isFailed) {
      return null;
    }

    return (
      <Tabs type="buttons">
        <TabsItem onClick={() => this._setTab('chats')} selected={this.data.tab === 'chats'}>Чаты</TabsItem>
        <TabsItem onClick={() => this._setTab('fav')} selected={this.data.tab === 'fav'}>Избранные</TabsItem>
        <TabsItem onClick={() => this._setTab('guests')} selected={this.data.tab === 'guests'}>Гости <span className="Activity__new_guests">{this.data.newGuests ? `+${this.data.newGuests}` : ''}</span></TabsItem>
      </Tabs>
    )
  }

  _renderTabsContent() {
    switch (this.data.tab) {
      case 'chats':
        return <div className="im_dialogs">{this._renderDialogs()}</div>;
      case 'guests':
        return this._renderGuests();
      case 'fav':
        return this.__renderFav();
    }
  }

  _renderStatsButton() {
    return (
      <HeaderButton onClick={() => actions.openStats()}>
        <Icon24Poll />
      </HeaderButton>
    )
  }

  _renderDialogs() {
    const dialogs = this.props.state.dialogs;

    if (this.data.isLoading && dialogs.length === 0) {
      return <div className="Activity__loader"><Spinner/></div>;
    }

    if (this.data.isFailed) {
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

    const now = Math.floor(new Date().getTime() / 1000);
    return dialogs.map((dialog) => {
      const user = this.props.state.usersInfo[dialog.user.id];
      if (!user) {
        return null;
      }

      let text;
      if (dialog.want_to_talk && !dialog.message.id) {
        text = <div className="im_dialog_system">Хочет общаться!</div>;
      } else {
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
      }

      const isOnline = now - user.last_update < 60 * 10;

      const className = utils.classNames({
        im_dialog: true,
        premium: dialog.premium === true
      });

      return (
        <div className={className} key={dialog.id} onClick={() => actions.openChat(dialog.id)}>
          <div className="im_dialog_cont_wrap">
            <div className="im_dialog_photo" style={{backgroundImage: `url(${user.small_photo})`}} />
            <div className="im_dialog_cont">
              <div className="im_dialog_name_wrap">
                <div className="im_dialog_name">{user.name}</div>
                {isOnline && <div className="im_dialog_name_online" />}
              </div>
              <div className="im_dialog_message">{text}</div>
            </div>
            <div className="im_dialog_badge">{dialog.badge > 0 && dialog.badge}</div>
          </div>
          <div className="im_dialog_separator" />
        </div>
      )
    });
  }

  _renderFeatured() {
    const users = this.props.state.featuredUsers;

    if (users.length === 0) {
      return null;
    }

    utils.statReachGoal('feature_block_view');

    return (
      <div>
        <div className="live_feed_featured_helper" />
        <div className="live_feed_featured" style={{top: `${utils.getHeaderHeight()}px`}}>
          {this._renderFeaturedRows(users)}
        </div>
      </div>
    )
  }

  _renderFeaturedRows(users) {
    let res = users.map((user, i) => {
      return (
        <div
          className="live_feed_featured_item"
          key={i}
          onClick={() => actions.openProfile(user, {fromFeature: true})}
        >
          <div className="live_feed_featured_item_photo" style={{backgroundImage: `url(${user.small_photo})`}}>
            <div className="live_feed_featured_item_name">{user.name}</div>
          </div>
        </div>
      )
    });

    //let curUser = this.props.state.usersInfo[this.props.state.userId];
    /*res.unshift(<div
      className="live_feed_featured_item add_btn"
      key={-1}
      onClick={this._featureDidPress}
    >
      <div className="live_feed_featured_item_photo" style={{backgroundImage: `url(${curUser.small_photo})`}} />
    </div>);*/

    // this.props.state.isFeatureTTShown
    /*

    */

    res.unshift(this._renderFeatureAddButton());

    return res;
  }

  _renderFeatureAddButton() {
    const user = this.props.state.usersInfo[this.props.state.userId];
    return (
      <div
        className="live_feed_featured_item add_btn"
        key={-1}
        onClick={this._featureDidPress}
      >
        <div className="live_feed_featured_item_photo" style={{backgroundImage: `url(${user.small_photo})`}} />
      </div>
    )

    /*return (
      <div
        className="live_feed_featured_pay_button"
        key={-1}
        onClick={this._featureDidPress}
      >
        <div className="live_feed_featured_pay_button_text">Хочу<br/>сюда</div>
      </div>
    )*/
  }

  _renderLikes() {
    if (this.data.isLoading && this.props.state.dialogs.length === 0 || !this.data.likesCount) {
      return null;
    }

    const likes = this.props.state.likes;
    return <Group>
      <Cell
        before={<Icon24Like />}
        expandable
        onClick={() => {
          actions.openLikes();
          utils.statReachGoal('likes_open_modal');
        }}
      >Вы нравитесь {utils.gram(this.data.likesCount, ['человеку', 'людям', 'людям'])}</Cell>
    </Group>;

      /*
      {likes.length > 0 && <HorizontalScroll>
        <div className="likes_rows">
          {this._renderLikesRows(likes)}
        </div>
      </HorizontalScroll>}
       */
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
          onClick={() => {
            actions.openLikes();
            utils.statReachGoal('likes_open_modal');
          }}
        >
          <div className="likes_row_photo_wrap">
            <div className="likes_row_photo" style={{backgroundImage: `url(${like.user.small_photo})`}} />
            <div className="likes_row_new_indicator" />
          </div>
        </div>
      )
    });
  }

  _load = () => {
    activityActions.load();
  };

  _loadMore = () => {
    this.setState({isLoadingMore: true});
    activityActions.loadMore().then(() => {
      this.setState({isLoadingMore: false});
    }).catch(() => {
      this.setState({isLoadingMore: false});
    });
  };

  _featureDidPress = () => {
    payments.showFeatureBox();
  };

  _renderMoreButton() {
    if (this.data.tab === 'chats') {
      if (this.data.isLoading || this.data.isFailed || !this.data.nextFrom) {
        return null;
      }

      return (
        <div className="Likes__load-more-wrap" onClick={this._loadMore}>
          <div className="Likes__load-more">{this.state.isLoadingMore ? 'Загрузка..' : 'Показать больше'}</div>
        </div>
      )
    } else if (this.data.tab === 'guests') {
      if (this.data.isLoadingGuests || this.data.isFailedGuests || !this.data.guestsNextFrom) {
        return null;
      }

      return (
        <div className="Likes__load-more-wrap" onClick={this._loadMoreGuests}>
          <div className="Likes__load-more">{this.state.isGuestsLoadingMore ? 'Загрузка..' : 'Показать больше'}</div>
        </div>
      )
    } else if (this.data.tab === 'fav') {
      if (this.data.isLoadingFav || this.data.isFailedFav || !this.data.favNextFrom) {
        return null;
      }

      return (
        <div className="Likes__load-more-wrap" onClick={this._loadMoreFav}>
          <div className="Likes__load-more">{this.state.isFavLoadingMore ? 'Загрузка..' : 'Показать больше'}</div>
        </div>
      )
    } else {
      return null;
    }
  }

  _setTab(tab) {
    this.setData({tab});

    if (tab === 'guests') {
      activityActions.loadGuests();
    } else if (tab === 'fav') {
      this.loadFav();
    }
  }

  _renderGuests() {
    if (this.data.isLoadingGuests) {
      return <div className="Activity__loader"><Spinner/></div>;
    }

    if (this.data.isFailedGuests) {
      return <div className="Activity__failed">
        <div className="Activity__failed_msg">Произошла ошибка</div>
        <Button size="l" onClick={() => activityActions.loadGuests()}>Повторить</Button>
      </div>;
    }

    if (!this.data.guests.length) {
      return <div className="Likes__empty">Пока гостей нет</div>
    }

    const now = Math.floor(new Date().getTime() / 1000);
    return this.data.guests.map((guest) => {
      const user = this.props.state.usersInfo[guest.id];
      if (!user) {
        return null;
      }

      const dateStr = utils.lastUpdateFormat(guest.add_date * 1000);
      let text = utils.genderText(user.gender, [
        `заходил ${dateStr}`,
        `заходила ${dateStr}`
      ]);

      const isOnline = now - user.last_update < 60 * 10;

      return (
        <div className="im_dialog" key={guest.id} onClick={() => actions.openChat(guest.id)}>
          <div className="im_dialog_cont_wrap">
            <div className="im_dialog_photo" style={{backgroundImage: `url(${user.small_photo})`}} />
            <div className="im_dialog_cont">
              <div className="im_dialog_name_wrap">
                <div className="im_dialog_name">{user.name}</div>
                {isOnline && <div className="im_dialog_name_online" />}
              </div>
              <div className="im_dialog_message">{text}</div>
            </div>
          </div>
          <div className="im_dialog_separator" />
        </div>
      )
    });
  }

  _loadMoreGuests = () => {
    this.setState({isGuestsLoadingMore: true});
    activityActions.loadMoreGuests().then(() => {
      this.setState({isGuestsLoadingMore: false});
    }).catch(() => {
      this.setState({isGuestsLoadingMore: false});
    });
  };

  __renderFav() {
    if (this.data.isLoadingFav) {
      return <div className="Activity__loader"><Spinner/></div>;
    }

    if (this.data.isFailedFav) {
      return <div className="Activity__failed">
        <div className="Activity__failed_msg">Произошла ошибка</div>
        <Button size="l" onClick={this.loadFav}>Повторить</Button>
      </div>;
    }

    if (!this.data.favorites.length) {
      return <div className="Likes__empty">Вы не добавили никого в «Избранные»</div>
    }

    const now = Math.floor(new Date().getTime() / 1000);
    return this.data.favorites.map((guest) => {
      const user = this.props.state.usersInfo[guest.id];
      if (!user) {
        return null;
      }

      let text = <div className="im_dialog_system">у вас в «Избранных»</div>;
      const isOnline = now - user.last_update < 60 * 10;

      return (
        <div className="im_dialog" key={guest.id} onClick={(e) => {
          if (e.target.className !== 'im_dialog_fav'){
            actions.openChat(guest.id)
          }
        }}>
          <div className="im_dialog_cont_wrap">
            <div className="im_dialog_photo" style={{backgroundImage: `url(${user.small_photo})`}} />
            <div className="im_dialog_cont">
              <div className="im_dialog_name_wrap">
                <div className="im_dialog_name">{user.name}</div>
                {isOnline && <div className="im_dialog_name_online" />}
              </div>
              <div className="im_dialog_message">{text}</div>
            </div>
            <div className="im_dialog_fav" onClick={() => activityActions.removeFromFav(guest.id)} />
          </div>
          <div className="im_dialog_separator" />
        </div>
      )
    });
  }

  loadFav = () => {
    activityActions.loadFav();
  };

  _loadMoreFav = () => {
    this.setState({isFavLoadingMore: true});
    activityActions.loadMoreGuests().then(() => {
      this.setState({isFavLoadingMore: false});
    }).catch(() => {
      this.setState({isFavLoadingMore: false});
    });
  };
}
