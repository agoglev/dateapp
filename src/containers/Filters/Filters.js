import React from 'react';
import { Panel, FormLayout, Checkbox, RangeSlider, FixedLayout, Button, Radio } from '@vkontakte/vkui';
import * as actions from '../../actions/index';
import * as cardsActions from "../../actions/cards";
import BaseComponent from '../../BaseComponent';
import * as api from '../../services/api';
import UICloseButton from '../../components/UI/UICloseButton';
import Header from '../../components/proxy/Header';

export default class Filters extends BaseComponent {
  render() {
    if (window.isDesktop) {
      return this._renderContent();
    }

    return (
      <Panel id={this.props.id}>
        {this._renderContent()}
      </Panel>
    )
  }

  _renderContent() {
    const info = this.props.state.usersInfo[this.props.state.userId];
    const cityName = ` (${info.city_name})` || '';

    /*
    <div top="Пол">
            <Checkbox
              name="type"
              checked={this.data.woman}
              onChange={(e) => this.setData('woman', e.target.checked ? 1 : 0)}
            >Женщины</Checkbox>
            <Checkbox
              name="type"
              checked={this.data.man}
              onChange={(e) => this.setData('man', e.target.checked ? 1 : 0)}
            >Мужчины</Checkbox>
          </div>
     */

    return (
      <div>
        <Header
          left={<UICloseButton />}
        >
          Интересуют
        </Header>
        <FormLayout>
          <div top="Возраст" bottom={this._renderLabel()}>
            <RangeSlider
              min={17}
              max={55}
              step={1}
              onChange={(val) => {
                this.setData('ageFrom', val[0]);
                this.setData('ageTo', val[1]);
              }}
              value={[this.data.ageFrom, this.data.ageTo]}
            />
          </div>
          <div top="Дальность поиска" bottom={<span>Вы можете изменить город в <span className="Link" onClick={() => {
            actions.openEditProfile();
            return false;
          }}>редактировании анкеты</span></span>}>
            <Radio
              name="radio"
              checked={this.data.onlyCity}
              onChange={(e) => this.setData('onlyCity', true)}
            >Только город {cityName}</Radio>
            <Radio
              name="radio"
              checked={!this.data.onlyCity}
              onChange={(e) => this.setData('onlyCity', false)}
            >Вся область</Radio>
          </div>
          <Button size="xl" level="1" onClick={this._saveButtonDidPress}  style={{margin: 16}}>Сохранить</Button>
        </FormLayout>
      </div>
    )
  }

  _renderLabel() {
    if (this.data.ageFrom < 18 && this.data.ageTo > 54) {
      return 'все';
    } else if (this.data.ageFrom < 18) {
      return `до ${this.data.ageTo}`;
    } else if (this.data.ageTo > 54) {
      return `от ${this.data.ageFrom}`;
    } else {
      return `от ${this.data.ageFrom} до ${this.data.ageTo}`;
    }
  }

  _saveButtonDidPress = () => {
    let man = this.data.man;
    let woman = this.data.woman;

    if (!man && !woman) {
      return actions.showError('Выберите пол!');
    }

    actions.loaderShow();
    api.method(api.methods.saveFilters, {
      man,
      woman,
      age_from: this.data.ageFrom,
      age_to: this.data.ageTo,
      only_city: this.data.onlyCity ? 1 : 0
    }).then((user) => {
      actions.loaderSuccess();
      actions.setUser(user);
      cardsActions.clear();
      window.history.back();
    }).catch(() => actions.showError('Произошла ошибка'));
  };
}
