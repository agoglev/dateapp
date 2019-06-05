import React from 'react';
import BaseComponent from '../../BaseComponent';
import Header from '../../components/proxy/Header';
import * as UI from '@vkontakte/vkui';
import UIBackButton from '../../components/UI/UIBackButton';
import * as actions from "../../actions";
import * as api from '../../services/api';
import * as cardsActions from "../../actions/cards";

export default class EditExtraInfo extends BaseComponent {
  render() {
    if (window.isDesktop) {
      return this._renderWrap();
    }

    return (
      <UI.Panel id={this.props.id} theme="white">
        {this._renderWrap()}
      </UI.Panel>
    )
  }

  _renderWrap() {
    return (
      <div>
        <Header
          left={<UIBackButton />}
        >
          {this._getTitle()}
        </Header>
        <UI.FormLayout>
          {this._renderCont()}
          <UI.FixedLayout vertical="bottom" className="Join__footer_btn_wrap">
            <UI.Button size="xl" level="1" onClick={this._saveButtonDidPress} style={{margin: '16px 12px'}}>Сохранить</UI.Button>
          </UI.FixedLayout>
        </UI.FormLayout>
      </div>
    )
  }

  _getTitle() {
    switch (this.data.type) {
      case 'children':
        return 'Дети';
      case 'alcohol':
        return 'Алкоголь';
      case 'home':
        return 'Я живу';
      case 'relations':
        return 'Отношения';
      case 'gender':
        return 'Ориентация';
      case 'smoke':
        return 'Курение';
    }
  }

  _renderCont() {
    switch (this.data.type) {
      case 'children':
        return this._renderChildren();
      case 'alcohol':
        return this._renderAlcohol();
      case 'home':
        return this._renderHome();
      case 'relations':
        return this._renderRelations();
      case 'gender':
        return this._renderGender();
      case 'smoke':
        return this._renderSmoke();
    }
  }

  _renderChildren() {
    let items = [
      [0, 'Не выбранно'],
      [1, 'Уже взрослые'],
      [2, 'Уже есть'],
      [3, 'Нет, никогда'],
      [4, 'Когда-нибудь'],
    ];

    return (
      <div>
        {items.map(([value, label]) => <UI.Radio onChange={this._onChange} name="radio" value={value} key={value} defaultChecked={value === this.data.value}>{label}</UI.Radio>)}
      </div>
    )
  }

  _renderAlcohol() {
    let items = [
      [0, 'Не выбранно'],
      [1, 'Выпиваю в компании'],
      [2, 'Не пью'],
      [3, 'Не приемлю алкоголь'],
      [4, 'Много пью'],
    ];

    return (
      <div>
        {items.map(([value, label]) => <UI.Radio onChange={this._onChange} name="radio" value={value} key={value} defaultChecked={value === this.data.value}>{label}</UI.Radio>)}
      </div>
    )
  }

  _renderHome() {
    let items = [
      [0, 'Не выбранно'],
      [1, 'Отдельно'],
      [2, 'В общежитии'],
      [3, 'С родителями'],
      [4, 'Со второй половиной'],
      [5, 'С соседями'],
    ];

    return (
      <div>
        {items.map(([value, label]) => <UI.Radio onChange={this._onChange} name="radio" value={value} key={value} defaultChecked={value === this.data.value}>{label}</UI.Radio>)}
      </div>
    )
  }

  _renderRelations() {
    const userInfo = this.props.state.usersInfo[this.props.state.userId] || {};
    let items = [
      [0, 'Не выбранно'],
      [1, 'Все сложно'],
      [2, userInfo.gender === 1 ? 'Свободна' : 'Свободен'],
      [3, userInfo.gender === 1 ? 'Занята' : 'Занят'],
    ];

    return (
      <div>
        {items.map(([value, label]) => <UI.Radio onChange={this._onChange} name="radio" value={value} key={value} defaultChecked={value === this.data.value}>{label}</UI.Radio>)}
      </div>
    )
  }

  _renderGender() {
    const userInfo = this.props.state.usersInfo[this.props.state.userId] || {};
    let items = [
      [0, 'Не выбранно'],
      [1, 'Би'],
      [2, userInfo.gender === 1 ? 'Лесби' : 'Гей'],
      [3, 'Спросите меня'],
      [4, 'Гетеро'],
    ];

    return (
      <div>
        {items.map(([value, label]) => <UI.Radio onChange={this._onChange} name="radio" value={value} key={value} defaultChecked={value === this.data.value}>{label}</UI.Radio>)}
      </div>
    )
  }

  _renderSmoke() {
    const userInfo = this.props.state.usersInfo[this.props.state.userId] || {};
    let items = [
      [0, 'Не выбранно'],
      [1, userInfo.gender === 1 ? 'Заядлая курильщица' : 'Заядлый курильщик'],
      [2, 'Категорически против курения'],
      [3, 'Не курю'],
      [4, 'Курю за компанию'],
      [5, 'Курю время от времени'],
    ];

    return (
      <div>
        {items.map(([value, label]) => <UI.Radio onChange={this._onChange} name="radio" value={value} key={value} defaultChecked={value === this.data.value}>{label}</UI.Radio>)}
      </div>
    )
  }

  _onChange = (e) => this.setData('value', parseInt(e.target.value, 10));

  _saveButtonDidPress = () => {
    actions.loaderShow();
    api.method(api.methods.editExtra, {
      type: this.data.type,
      value: this.data.value
    }).then(() => {
      const userInfo = this.props.state.usersInfo[this.props.state.userId] || {};
      userInfo.extra[this.data.type] = this.data.value;
      actions.setUser(userInfo);
      actions.loaderSuccess();
      window.history.back();
    }).catch(() => {
      actions.loaderHide();
      actions.showError('Произошла ошибка!');
    });
  };
}
