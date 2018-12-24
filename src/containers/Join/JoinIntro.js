import './Join.css'

import React from 'react';
import BaseComponent from '../../BaseComponent';
import { Div, Group, Button } from '@vkontakte/vkui';
import * as actions from '../../actions';
import * as pages from '../../constants/pages';
import * as utils from '../../utils';
import Header from '../../components/proxy/Header';
import * as accountActions from "../../actions/account";
import * as api from '../../services/api';

export default class JoinIntro extends BaseComponent {
  componentDidMount() {
    utils.statReachGoal('join_intro');
  }

  render() {
    return (
      <div>
        <Header>
          Знакомства
        </Header>
        <Group>
          <Div>
            <div className="Join__intro-art-wrap">
              <div className="Join__intro-art" />
            </div>
            <div className="Join__intro">
              <div className="Join__intro-title">Знакомиться просто</div>
              <div className="Join__intro-caption">Поможем познакомиться с новыми интересными людьми, начать общение, а может, и нечто большее.</div>
            </div>
          </Div>
          <Div>
            <Button size="xl" level="1" onClick={this._buttonDidPress}>Заполнить анкету</Button>
          </Div>
        </Group>
      </div>
    )
  }

  _buttonDidPress = () => {
    if (window.isDG) {
      actions.loaderShow();
      api.vk('users.get', {
        fields: 'sex,bdate,country,city'
      }).then((users) => {
        actions.loaderHide();
        console.log(users);
        accountActions.setupVkInfo(users[0]);
        setTimeout(actions.openJoinStep1, 100);
      }).catch(() => actions.showError());
    } else {
      actions.openJoinStep1();
    }
  };
}