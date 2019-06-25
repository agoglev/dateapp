import './Profile.css';

import React, { Component, PureComponent } from 'react';
import { PanelHeader, Group, List, Cell } from '@vkontakte/vkui';
import * as actions from '../../actions/index';
import * as accountActions from '../../actions/account';
import * as utils from '../../utils/index';
import connect from '@vkontakte/vkui-connect';
import Header from '../../components/proxy/Header';
import * as payments from '../../actions/payments';
import * as native from '../../services/native';

import Icon24Settings from '@vkontakte/icons/dist/24/settings';
import Icon24Filter from '@vkontakte/icons/dist/24/filter';
import Icon24Notification from '@vkontakte/icons/dist/24/notification';
import Icon24Share from '@vkontakte/icons/dist/24/share';
import Icon24Users from '@vkontakte/icons/dist/24/users';
import Icon24Message from '@vkontakte/icons/dist/24/message';
import Icon24User from '@vkontakte/icons/dist/24/user';
import Icon24UserOutgoing from '@vkontakte/icons/dist/24/user_outgoing';
import Icon24Money from '@vkontakte/icons/dist/24/money_circle';

export default class Profile extends Component {
  componentDidMount() {
    this.refs['wrap'].style.paddingBottom = (utils.getTabBarHeight() + 16) + 'px';

    utils.statReachGoal('page_profile');
  }

  render() {
    const userInfo = this.props.state.usersInfo[this.props.state.userId];

    return (
      <div ref="wrap">
        <Header>
          Профиль
        </Header>
        <Group>
          <div className="profile_wrap">
            <div
              className="profile_photo"
              style={{backgroundImage: `url(${userInfo.big_photo})`}}
              onClick={() => actions.openProfile(userInfo)}
            />
            <div className="profile_cont">
              <div className="profile_name">{userInfo.name}</div>
              <div
                className="profile_edit_button"
                onClick={() => actions.openEditProfile()}
              >Редактировать</div>
            </div>
            {this._renderPremium()}
          </div>
        </Group>
        <Group>
          <List>
            {!window.isOK && !window.isNative && utils.isPaymentsEnabled() && <Cell expandable before={<Icon24Share />} onClick={() => {
              if (window.isDG) {
                this._shareApp();
              } else {
                actions.openInvites();
              }
            }}>Пригласить друзей</Cell>}
            {(window.GroupRole === 'admin' || utils.isDev()) && <Cell expandable before={<Icon24Settings />} onClick={() => actions.openAdmin()}>Админка</Cell>}
            {this.props.state.isModer && <Cell expandable before={<Icon24Settings />} onClick={() => actions.openModer()}>Модерация</Cell>}
            <Cell expandable before={<Icon24Filter />} onClick={() => actions.openFilters()} indicator={this._renderFiltersLabel()}>Интересуют</Cell>
            <Cell expandable before={<Icon24Notification />} onClick={() => actions.openNotify()}>Уведомления</Cell>
            {!window.isNative && (window.GroupRole === 'none' || window.GroupRole === 'member') && <Cell before={<Icon24Money />} onClick={() => actions.openMonetization()}>Есть свое сообщество?</Cell>}
            {!window.isOK && <Cell expandable before={<Icon24Users />} href="https://vk.com/dateapp" target="_blank">Сообщество</Cell>}
            {!window.isOK && <Cell expandable before={<Icon24Message />} href="https://vk.me/dateapp" target="_blank">Сообщить о проблеме</Cell>}
            <Cell before={<Icon24User />} onClick={this._deleteAccountButtonDidPress}>Удалить анкету</Cell>
            {window.isNative && <Cell before={<Icon24UserOutgoing />} onClick={this._logoutDidPress}>Выйти</Cell>}
          </List>
        </Group>
        {this._renderDev()}
        <div className="profile_copyright">The Dating Service © 2018</div>
      </div>
    )
  }

  _renderPremium() {
    if (!utils.isPaymentsEnabled() && !this.props.state.hasPremium) {
      return null;
    }

    const premiumLable = this.props.state.hasPremium ? <div className="notification_caption grey">Активирован</div> : <div className="notification_caption">Активировать</div>;
    return (
      <div className="notification payments_profile_block" onClick={() => {
        if (!this.props.state.hasPremium) {
          payments.showSubscriptionRequest('profile');
        } else {
          actions.openPremium();
        }
      }}>
        <div className="notification_photo" />
        <div className="notification_cont">
          <div className="notification_title">Знакомства «Премиум»</div>
          {premiumLable}
        </div>
        {!this.props.state.hasPremium && <div className="notification_close" />}
      </div>
    )
  }

  _logoutDidPress = () => {
    actions.showAlert('Выход', 'Вы действительно хотите выйти?', 'Да, выйти').then(() => {
      native.logout(true);
    });
  };

  _renderDev() {
    if (this.props.state.userId !== 1 && this.props.state.userId !== 3) {
      return null;
    }

    return (
      <Group>
        <div className="Profile__dev_row">
          <div className="Profile__dev_row-field">Token:</div>
          <div className="Profile__dev_row-value">{this.props.state.vkAccessToken}</div>
        </div>
      </Group>
    )
  }

  _renderFiltersLabel() {
    const userInfo = this.props.state.usersInfo[this.props.state.userId];

    let components = [];
    if (userInfo.filters.man && userInfo.filters.woman) {
      components.push('все');
    } else if (userInfo.filters.man) {
      components.push('мужчины');
    } else if (userInfo.filters.woman) {
      components.push('женщины');
    }

    if (userInfo.filters.age_from < 18 && userInfo.filters.age_to > 54) {
      // nothing to do
    } else if (userInfo.filters.age_from < 18) {
      components.push(`до ${userInfo.filters.age_to}`);
    } else if (userInfo.filters.age_to > 54) {
      components.push(`от ${userInfo.filters.age_from}`);
    } else {
      components.push(`от ${userInfo.filters.age_from} до ${userInfo.filters.age_to}`);
    }

    return components.join(', ');
  }

  _deleteAccountButtonDidPress = () => {
    actions.showAlert('Удаление анкеты', 'Вы действительно хотите удалить свою анкету?', 'Да, удалить', {
      okStyle: 'destructive'
    }).then(() => {
      actions.loaderShow();
      accountActions.deleteAccount()
        .then(() => actions.loaderSuccess())
        .catch(() => actions.showError('Произошла ошибка!'));
    });
  };

  _shareApp = () => {
    if (window.isDG) {
      window.VK.callMethod('showShareBox', '', ['https://vk.com/app6379407'], 'wall');
    } else {
      connect.send('VKWebAppShare', {link: 'https://vk.com/app6682509'});
    }
  };
}

export class ProfileButton extends PureComponent {
  render() {
    const {
      type,
      onClick,
      children,
      label
    } = this.props;

    const iconClassName = utils.classNames({
      profile_button_icon: true,
      [type]: true
    });

    let props = {};
    if (onClick) {
      props.onClick = onClick;
    }

    return (
      <div className="profile_button" {...props}>
        <div className={iconClassName} />
        <div className="profile_button_title">{children}</div>
        {label && <div className="profile_button_right">
          <div className="profile_button_indicator" id="profile_filters">{label}</div>
          <div className="profile_button_arrow" />
        </div>}
      </div>
    )
  }
}
