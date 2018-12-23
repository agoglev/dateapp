import React from 'react';
import BaseComponent from '../../BaseComponent';
import UICloseButton from '../../components/UI/UICloseButton';
import Header from '../../components/proxy/Header';
import { Panel, Group, Spinner, Button, FormLayout, Checkbox, FormStatus } from '@vkontakte/vkui';
import * as api from '../../services/api';
import * as actions from '../../actions';

export default class Premium extends BaseComponent {
  componentDidMount() {
    this._load();
  }

  render() {
    if (window.isDesktop) {
      return this._renderCont();
    }

    return (
      <Panel id={this.props.id}>
        {this._renderCont()}
      </Panel>
    )
  }

  _renderCont() {
    return (
      <div>
        <Header
          left={<UICloseButton />}
        >
          «Премиум»
        </Header>
        {this._renderContent()}
      </div>
    )
  }

  _renderContent() {
    if (this.data.isLoading) {
      return <div className="Activity__loader"><Spinner/></div>;
    }

    if (this.data.isFailed) {
      return <div className="Activity__failed">
        <div className="Activity__failed_msg">Произошла ошибка</div>
        <Button size="l" onClick={this._load}>Повторить</Button>
      </div>;
    }

    return (
      <FormLayout top="test">
        <div className="Premium__expire">Премиум доступен еще <span>{this.data.available}</span></div>
        <Checkbox
          checked={this.data.invisible}
          onChange={(e) => this.setData({invisible: e.target.checked})}
          bottom="Вы не будете попадать в раздел «Гости» у других пользователей. Функция действует только с момента включения."
        >Включить невидимку</Checkbox>
        <Button size="xl" level="1" onClick={this._saveButtonDidPress}>Сохранить</Button>
      </FormLayout>
    )
  }

  _load = () => {
    this.setData({
      isLoading: true,
      isFailed: false
    });
    api.method(api.methods.premium).then(({invisible, available}) => {
      this.setData({
        isLoading: false,
        invisible,
        available
      });
    }).catch(() => {
      this.setData({
        isLoading: false,
        isFailed: true
      });
    });
  };

  _saveButtonDidPress = () => {
    actions.loaderShow();
    api.method(api.methods.premiumSave, {
      invisible: this.data.invisible ? 1 : 0
    }).then(() => {
      actions.loaderSuccess();
      window.history.back();
    }).catch(() => actions.showError());
  };
}
