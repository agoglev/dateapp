import './Activity.css';

import React, { Component } from 'react';
import { PanelHeader, Button, Spinner, Group, Header, HorizontalScroll } from '@vkontakte/vkui';
import * as actions from '../../actions';
import * as activityActions from '../../actions/activity';
import * as accountActions from '../../actions/account';
import * as utils from '../../utils';
import * as pages from '../../constants/pages';
import * as api from '../../services/api';
import NotificationsPermission from '../../components/NotificationsPermission/NotificationsPermission';

export default class Activity extends Component {
  constructor() {
    super();

    this.state = {
      isLoading: false,
      isFailed: false
    };
  }

  componentDidMount() {
    this._load();
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
        <PanelHeader>
          Активность
        </PanelHeader>
        {this._renderFeatured()}
        {this._renderLikes()}
        <div id="yandex_rtb_R-A-159294-836" />
        <Group>
          <div className="im_dialogs">
            {this._renderDialogs()}
          </div>
        </Group>
      </div>
    )
  }

  _renderDialogs() {
    const dialogs = this.props.state.dialogs;

    if (this.state.isLoading && dialogs.length === 0) {
      return <div className="Activity__loader"><Spinner/></div>;
    }

    if (this.state.isFailed) {
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

    return dialogs.map((dialog) => {
      let text;
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

      const user = this.props.state.usersInfo[dialog.user.id];
      return (
        <div className="im_dialog" key={dialog.id} onClick={() => actions.go(pages.IM_HISTORY, {peerId: dialog.id})}>
          <div className="im_dialog_photo" style={{backgroundImage: `url(${user.small_photo})`}} />
          <div className="im_dialog_cont">
            <div className="im_dialog_name">{user.name}</div>
            <div className="im_dialog_message">{text}</div>
          </div>
          <div className="im_dialog_badge">{dialog.badge > 0 && dialog.badge}</div>
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
      <Group>
        <div className="live_feed_featured">
          {this._renderFeaturedRows(users)}
        </div>
      </Group>
    )
  }

  _renderFeaturedRows(users) {
    let res = users.map((user, i) => {
      return (
        <div
          className="live_feed_featured_item"
          key={i}
          onClick={() => actions.go(pages.PROFILE, {user: user, fromFeature: true})}
        >
          <div className="live_feed_featured_item_photo" style={{backgroundImage: `url(${user.small_photo})`}}>
            <div className="live_feed_featured_item_name">{user.name}</div>
          </div>
        </div>
      )
    });

    let curUser = this.props.state.usersInfo[this.props.state.userId];
    /*res.unshift(<div
      className="live_feed_featured_item add_btn"
      key={-1}
      onClick={this._featureDidPress}
    >
      <div className="live_feed_featured_item_photo" style={{backgroundImage: `url(${curUser.small_photo})`}} />
    </div>);*/

    res.unshift(<div
      className="live_feed_featured_pay_button"
      key={-1}
      onClick={this._featureDidPress}
    >
      <div className="live_feed_featured_pay_button_text">Хочу<br/>сюда</div>
    </div>);

    return res;
  }

  _renderLikes() {
    const likes = this.props.state.likes;

    if (likes.length === 0) {
      return null;
    }

    utils.statReachGoal('likes_block_view');

    return (
      <Group style={{ paddingBottom: 8 }}>
        <Header level="2">Последние лайки</Header>
        <HorizontalScroll>
          <div className="likes_rows">
            {this._renderLikesRows(likes)}
          </div>
        </HorizontalScroll>
      </Group>
    )
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
          onClick={() => actions.go(pages.PROFILE, {user: like.user, fromLikes: true})}
        >
          <div className="likes_row_photo_wrap">
            <div className="likes_row_photo" style={{backgroundImage: `url(${like.user.small_photo})`}} />
            <div className="likes_row_new_indicator" />
          </div>
          <div className="likes_row_name">{like.user.name}</div>
        </div>
      )
    });
  }

  _load = () => {
    this.setState({
      isLoading: true,
      isFailed: false
    });
    activityActions.load().then(() => {
      this.setState({
        isLoading: false
      });
    }).catch(() => {
      this.setState({
        isLoading: false,
        isFailed: true
      });
    });
  };

  _featureDidPress = () => {
    const btnText = window.isDG ? 'Получить' : 'Получить за 49 р.';
    actions.setPopout(<NotificationsPermission
      title="Больше посетителей"
      caption="Окажитесь на виду у всех — разместите анкету над сообщениями"
      type="likes"
      button={btnText}
      onClick={() => {
        actions.loaderShow();

        if (window.isDG) {
          api.showOrderBox('feature_feed').then(() => {
            actions.loaderSuccess();
            activityActions.addMeToFeatured();
          }).catch((isFailed) => {
            if (isFailed) {
              actions.showError();
            } else {
              actions.loaderHide();
            }
          });
        } else {
          actions.vkPayRequest(49, 'Больше просмотров.').then(() => {
            actions.loaderSuccess();
            activityActions.addMeToFeatured();
          }).catch(() => actions.showError());
        }

        utils.statReachGoal('feature_buy_btn');
      }}
    />);

    utils.statReachGoal('feature_btn');
  };
}
