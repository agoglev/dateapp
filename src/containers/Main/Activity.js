import './Activity.css';

import React from 'react';
import { Button, Spinner, Group, HorizontalScroll, Cell, HeaderButton, Tabs, TabsItem, Avatar, List, FixedLayout, Counter } from '@vkontakte/vkui';
import * as actions from '../../actions';
import * as activityActions from '../../actions/activity';
import * as accountActions from '../../actions/account';
import * as utils from '../../utils';
import Icon24Like from '@vkontakte/icons/dist/24/like';
import Header from '../../components/proxy/Header';
import * as payments from "../../actions/payments";
import Icon24Poll from '@vkontakte/icons/dist/24/poll';
import BaseComponent from '../../BaseComponent';
import {favCanWrite} from "../../actions/activity";

export default class Activity extends BaseComponent {
  constructor(props) {
    super(props);

    this.state = {
      isLoadingMore: false,
      promoteFeature: false,
      isNeedShowFeatureSuggestion: utils.isPaymentsEnabled() && props.state.isNeedShowFeatureSuggestion,
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

    if (this.state.isNeedShowFeatureSuggestion) {
      this.featureSuggestTimer = setTimeout(() => {
        this.setState({isNeedShowFeatureSuggestion: false});
      }, 5000);
      actions.featureSuggestionShown();
    }

    setTimeout(() => {
      if (this.refs['featured_scroll']) {
        this.refs['featured_scroll'].scrollLeft = this.data.featuredScroll;
        this.setData('featuredScroll', 0);
      }
    });

    this._updatePromoteFeature();
  }

  componentWillUnmount() {
    clearTimeout(this.featureSuggestTimer);
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
        <TabsItem onClick={() => this._setTab('fav')} selected={this.data.tab === 'fav'}>Избранные <span className="Activity__new_guests">{this.data.newFav ? `+${this.data.newFav}` : ''}</span></TabsItem>
        <TabsItem onClick={() => this._setTab('guests')} selected={this.data.tab === 'guests'}>Гости <span className="Activity__new_guests">{this.data.newGuests ? `+${this.data.newGuests}` : ''}</span></TabsItem>
      </Tabs>
    )
  }

  _renderTabsContent() {
    switch (this.data.tab) {
      case 'chats':
        return <div className="im_dialogs">
          {this._renderLikes()}
          {this._renderRoulette()}
          {this._renderDialogs()}
          </div>;
      case 'guests':
        return this._renderGuests();
      case 'fav':
        return this.__renderFav();
    }
  }

  _renderStatsButton() {
    if (window.isNative || !utils.isPaymentsEnabled()) {
      return null;
    }

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
        <div className="Activity__failed_msg">Произошла ошибка ({this.data.isFailed})</div>
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
    let res = dialogs.map((dialog) => {
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
            } else if (dialog.message.kludges.sticker_id) {
                text = 'Стикер';
            } else {
              text = dialog.message.text;
            }
            text = (dialog.message.inbox ? '' : 'Вы: ') + text;
        }
      }

      const isOnline = now - utils.convertTimezone(user.last_update) < 60 * 10;

      const className = utils.classNames({
        im_dialog: true,
        premium: dialog.premium === true
      });

      const badge = dialog.badge > 0 ? dialog.badge : false;
      const favClassName = utils.classNames({
        im_dialog_fav: true,
        active: dialog.is_fav || false
      });


      return (
        <div className={className} key={dialog.id} onClick={(e) => {
          if (!e.target.classList.contains('im_dialog_fav')) {
            actions.openChat(dialog.id)
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
            {badge && <div className="im_dialog_badge">{badge}</div>}
            {!badge && <div className={favClassName} onClick={() => this._toggleFav(dialog)} />}
          </div>
          <div className="im_dialog_separator" />
        </div>
      )
    });

    if (res.length > 2) {
      res.splice(2, 0, this._renderPromoteFeature());
    } else {
      res.push(this._renderPromoteFeature());
    }

    return res;
  }

  _renderFeatured() {
    const users = this.props.state.featuredUsers;

    if (users.length === 0) {
      return null;
    }

    utils.statReachGoal('feature_block_view');

    const className = utils.classNames({
      live_feed_featured: true,
      animated: this.featureSuggestTimer > 0,
    });

    return (
      <div>
        <FixedLayout className="live_feed_featured_wrap">
          <div className={className} ref="featured_scroll">
            {this._renderFeaturedRows(users)}
          </div>
        </FixedLayout>
        <div className="live_feed_featured_helper" />
      </div>
    )
  }

  _renderFeaturedRows(users) {
    let res = [];

    if (!this.state.isNeedShowFeatureSuggestion) {
      res = users.map((user, i) => {
        return (
          <div
            className="live_feed_featured_item"
            key={i}
            onClick={() => {
              this.setData('featuredScroll', this.refs['featured_scroll'].scrollLeft);
              actions.openProfile(user, {fromFeature: true});
            }}
          >
            <div className="live_feed_featured_item_photo" style={{backgroundImage: `url(${user.small_photo})`}}>
              <div className="live_feed_featured_item_name">{user.name}</div>
            </div>
          </div>
        )
      });
    }

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

    if (utils.isPaymentsEnabled()) {
      res.unshift(this._renderFeatureAddButton());
    }

    if (this.state.isNeedShowFeatureSuggestion) {
      res.push(<div className="Feature__suggest" key="suggest" onClick={this._featureDidPress}>
        <div className="Feature__suggest__title">Разместите анкету здесь,<br />и Вас точно заметят!</div>
      </div>);
    }

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

    return (
      <div
        className="im_dialog"
        onClick={() => {
          actions.openLikes();
          utils.statReachGoal('likes_open_modal');
        }}
      >
        <div className="im_dialog_cont_wrap">
          <div className="im_dialog_photo likes">
            <Icon24Like fill="var(--white)" />
          </div>
          <div className="im_dialog_cont">
            <div className="im_dialog_name_wrap">
              <div className="im_dialog_name">Вы понравились {utils.gram(this.data.likesCount, ['человеку', 'людям', 'людям'])}!</div>
            </div>
            <div className="im_dialog_message im_dialog_system">{this.data.likesCount > 1 ? 'Посмотреть их' : 'Посмотреть'}</div>
          </div>
        </div>
        <div className="im_dialog_separator" />
      </div>
    );

    /*return (
      <Group>
        <List>
          <Cell
            expandable
            before={<Avatar style={{ background: 'var(--destructive)' }} size={28}><Icon16Like fill="var(--white)" /></Avatar>}
            description={`Вы понравились ${utils.gram(this.data.likesCount, ['человеку', 'людям', 'людям'])}`}
            onClick={() => {
              actions.openLikes();
              utils.statReachGoal('likes_open_modal');
            }}
          >
            Лайки
          </Cell>
        </List>
      </Group>
    );*/

    //const likes = this.props.state.likes;

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
          <Button size="xl">{this.data.isLoadingMore ? 'Загрузка..' : 'Показать больше'}</Button>
        </div>
      );
    } else if (this.data.tab === 'guests') {
      if (this.data.isLoadingGuests || this.data.isFailedGuests || !this.data.guestsNextFrom) {
        return null;
      }

      return (
        <div className="Likes__load-more-wrap" onClick={this._loadMoreGuests}>
          <Button size="xl">{this.data.isGuestsLoadingMore ? 'Загрузка..' : 'Показать больше'}</Button>
        </div>
      );
    } else if (this.data.tab === 'fav') {
      if (this.data.isLoadingFav || this.data.isFailedFav || !this.data.favNextFrom) {
        return null;
      }

      return (
        <div className="Likes__load-more-wrap" onClick={this._loadMoreFav}>
          <Button size="xl">{this.data.isFavLoadingMore ? 'Загрузка..' : 'Показать больше'}</Button>
        </div>
      );
    } else {
      return null;
    }
  }

  _setTab(tab) {
    if (tab === this.data.tab) {
      return;
    }

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
        <div className="Activity__failed_msg">Произошла ошибка ({this.data.isFailedGuests})</div>
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

      const isOnline = now - utils.convertTimezone(user.last_update) < 60 * 10;

      return (
        <div className="im_dialog" key={guest.id} onClick={() => actions.openProfile(guest)}>
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
        <div className="Activity__failed_msg">Произошла ошибка ({this.data.isFailedFav})</div>
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

      let text;
      if (user.is_inbox_fav) {
        text = <div className="im_dialog_system">{utils.genderText(user.gender, [
          'добавил Вас в «Избранные»',
          'добавила Вас в «Избранные»'
        ])}</div>;
      } else {
        text = <div className="im_dialog_system">у Вас в «Избранных»</div>;
      }
      const isOnline = now - utils.convertTimezone(user.last_update) < 60 * 10;
      const isInbox = activityActions.inboxFavs[guest.id] === true;

      const className = utils.classNames({
        im_dialog: true,
        hidden: isInbox && !this.props.state.hasPremium && utils.isPaymentsEnabled()
      });

      return (
        <div className={className} key={guest.id} onClick={(e) => {
          if (isInbox && !this.props.state.hasPremium && utils.isPaymentsEnabled()) {
            payments.showSubscriptionRequest('fav');
          } else if (!e.target.classList.contains('im_dialog_fav')) {
            if (!activityActions.favCanWrite[guest.id] && utils.isPaymentsEnabled() && !this.props.state.hasPremium) {
              payments.showSkipMathcBox(user);
            } else {
              actions.openChat(user.id);
            }
          }
        }}>
          <div className="im_dialog_cont_wrap">
            <div className="im_dialog_photo_wrap">
              <div className="im_dialog_photo" style={{backgroundImage: `url(${user.small_photo})`}} />
            </div>
            <div className="im_dialog_cont">
              <div className="im_dialog_name_wrap">
                <div className="im_dialog_name">{user.name}</div>
                {isOnline && <div className="im_dialog_name_online" />}
              </div>
              <div className="im_dialog_message">{text}</div>
            </div>
            {!isInbox && <div className="im_dialog_fav active" onClick={() => activityActions.removeFromFav(guest.id)} />}
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

  _toggleFav = (dialog) => {
    actions.loaderShow();
    activityActions.toggleFav(dialog.user.id, !dialog.is_fav).then(() => {
      actions.loaderSuccess();
    }).catch((err) => actions.showError(err.message));
  };

  _renderRoulette() {
    if (this.data.isLoading || window.isNative || true) {
      return null;
    }

    return (
      <a href="https://vk.com/rouletka" target="_blank" className="im_dialog" style={{textDecoration: 'none', display: 'block'}} onClick={() => utils.statReachGoal('roulette')}>
        <div className="im_dialog_cont_wrap">
          <div className="im_dialog_photo" style={{backgroundImage: `url(https://sun1-17.userapi.com/c853520/v853520764/16493/1kk9RMjnJVo.jpg?ava=1)`}} />
          <div className="im_dialog_cont">
            <div className="im_dialog_name_wrap">
              <div className="im_dialog_name">Рулетка</div>
            </div>
            <div className="im_dialog_message">Общение с незнакомцами</div>
          </div>
        </div>
        <div className="im_dialog_separator" />
      </a>
    )
  }

  _updatePromoteFeature() {
    this.setState({promoteFeature: payments.promoteFeature()});
  }

  _renderPromoteFeature() {
    if (!this.state.promoteFeature || !utils.isPaymentsEnabled()) {
      return null;
    }

    return (
      <div
        className="im_dialog"
        key="promote"
        onClick={() => {
          this.state.promoteFeature.onClick();
          this._updatePromoteFeature();
        }}
      >
        <div className="im_dialog_cont_wrap">
          <div className="im_dialog_photo" style={{backgroundImage: `url(${this.state.promoteFeature.icon})`}} />
          <div className="Activity__promote_feature__caption">{this.state.promoteFeature.caption}</div>
        </div>
        <div className="im_dialog_separator" />
      </div>
    )
  }
}
