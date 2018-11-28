import './Join.css'

import React from 'react';
import BaseComponent from '../../BaseComponent';
import * as actions from '../../actions';
import * as accountActions from '../../actions/account';
import * as pages from '../../constants/pages';
import { Panel, PanelHeader, FormLayout, Input, Select, Button } from '@vkontakte/vkui';
import UiBirthDay from '../../components/UI/UiBirthDay';
import * as utils from "../../utils";
import UICloseButton from '../../components/UI/UICloseButton';
import Header from '../../components/proxy/Header';

export default class JoinStep1 extends BaseComponent {
  componentDidMount() {
    utils.statReachGoal('join_step1');
  }

  render() {
    if (window.isDesktop) {
      return <div>{this._renderContent()}</div>;
    }

    return <Panel id={this.props.id}>{this._renderContent()}</Panel>;
  }

  _renderContent() {
    const { state } = this.props;

    return (
      <div>
        <Header
          left={<UICloseButton />}
        >
          Общее
        </Header>
        <FormLayout>
          <Input
            top="Имя"
            defaultValue={state.vkUserInfo.first_name}
            getRef={(ref) => this.nameRef = ref}
          />
          <Select
            top="Пол"
            getRef={(ref) => this.genderRef = ref}
            defaultValue={parseInt(accountActions.JoinInfo.gender || state.vkUserInfo.sex, 10)}
          >
            <option value="1">Женский</option>
            <option value="2">Мужской</option>
          </Select>
          <div top="Дата рождения">
            <UiBirthDay ref="birthday" />
          </div>
          <Button size="xl" level="1" onClick={this.continueButtonDidPress}>Далее</Button>
        </FormLayout>
      </div>
    )
  }

  continueButtonDidPress = () => {
    const name = utils.stripHTML(this.nameRef.value.trim());
    const gender = parseInt(this.genderRef.value, 10);
    const birthdays = this.refs['birthday'].getData();

    if (!name) {
      return actions.showError('Введите ваше имя');
    }

    accountActions.fillJoinInfo({
      name: this.nameRef.value.trim(),
      gender,
      ...birthdays
    });
    actions.go(pages.JOIN_STEP2);
  };
}
