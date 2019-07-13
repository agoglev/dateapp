import './Join.css'

import React from 'react';
import BaseComponent from '../../BaseComponent';
import * as actions from '../../actions';
import * as accountActions from '../../actions/account';
import * as pages from '../../constants/pages';
import { Panel, FormLayout, Input, Select, Button } from '@vkontakte/vkui';
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
    const bdate = (this.data.bdate || '').split('.').map((item) => parseInt(item, 10));
    const day = bdate[0] || 0;
    const month = Math.max(0, (bdate[1] - 1)) || 0;
    const year = bdate[2] || 0;

    return (
      <div>
        <Header
          left={<UICloseButton />}
        >
          Общее
        </Header>
        <FormLayout TagName="div">
          <Input
            top="Имя"
            defaultValue={this.data.first_name}
            getRef={(ref) => this.nameRef = ref}
            onChange={(e) => this.setData('first_name', e.target.value)}
            maxLength={60}
          />
          <Select
            top="Пол"
            getRef={(ref) => this.genderRef = ref}
            defaultValue={this.data.sex}
            onChange={(e) => this.setData('sex', parseInt(e.target.value, 10))}
          >
            <option value="0">Не выбран</option>
            <option value="1">Женский</option>
            <option value="2">Мужской</option>
          </Select>
          <div top="Дата рождения">
            <UiBirthDay ref="birthday" day={day} month={month} year={year} onChange={(date) => this.setData('bdate', `${date.day}.${date.month + 1}.${date.year}`)}/>
          </div>
          <Button size="xl" level="1" onClick={this.continueButtonDidPress}>Далее</Button>
        </FormLayout>
      </div>
    )
  }

  continueButtonDidPress = () => {
    const name = utils.stripHTML(this.data.first_name.trim());
    const gender = parseInt(this.data.sex, 10);
    const birthdays = this.data.bdate;

    if (!name) {
      return actions.showError('Введите Ваше имя');
    }

    if (!name.match(/^[a-zа-яё]+$/i)) {
      return actions.showAlert('Неверное имя', <span>У нас принято использовать <b>настоящее имя</b>, написанное русскими или латинскими буквами. Например: Анна, Иван, Anna, Ivan.</span>, 'OK', {
        skipCancelButton: true
      });
    }

    if (!gender) {
      return actions.showError('Выбирите Ваш пол');
    }

    accountActions.fillJoinInfo({
      name: this.nameRef.value.trim(),
      gender,
      ...birthdays
    });
    actions.openJoinStep2();
  };
}
