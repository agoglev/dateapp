import './Profile.css';

import React, { Component, PureComponent } from 'react';
import { PanelHeader, Group } from '@vkontakte/vkui';
import * as actions from '../../actions/index';
import * as accountActions from '../../actions/account';
import * as utils from '../../utils/index';
import * as pages from "../../constants/pages";
import connect from '@vkontakte/vkui-connect';
import Header from '../../components/proxy/Header';

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
              onClick={() => actions.go(pages.PROFILE, {user: userInfo, fromLikes: false})}
            />
            <div className="profile_cont">
              <div className="profile_name">{userInfo.name}</div>
              <div
                className="profile_edit_button"
                onClick={() => actions.openEditProfile()}
              >Редактировать</div>
            </div>
          </div>
        </Group>
        <Group>
          {this.props.state.isModer && <ProfileButton type="admin_settings" onClick={() => actions.openModer()}>Модерация</ProfileButton>}
          <ProfileButton type="filters" onClick={() => actions.openFilters()} label={this._renderFiltersLabel()}>Интересуют</ProfileButton>
          <ProfileButton type="share" onClick={this._shareApp}>Поделиться</ProfileButton>
          <a href="https://vk.com/dateapp" target="_blank" style={{textDecoration: 'none'}}>
            <ProfileButton type="community">Сообщество</ProfileButton>
          </a>
          <a href="https://vk.me/dateapp" target="_blank" style={{textDecoration: 'none'}}>
            <ProfileButton type="feedback">Сообщить о проблеме</ProfileButton>
          </a>
          <ProfileButton type="delete" onClick={this._deleteAccountButtonDidPress}>Удалить анкету</ProfileButton>
        </Group>
        {this._renderDev()}
        <div className="profile_copyright">The Dating Service © 2018</div>
      </div>
    )
  }

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
