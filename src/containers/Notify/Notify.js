import React from 'react';
import BaseComponent from '../../BaseComponent';
import { Panel, Group, Spinner, Button, FormLayout, FormLayoutGroup, Checkbox } from '@vkontakte/vkui';
import * as accountActions from '../../actions/account';
import Header from '../../components/proxy/Header';
import UICloseButton from '../../components/UI/UICloseButton';

export default class Notify extends BaseComponent {
  render() {
    if (window.isDesktop) {
      return this._renderWrap();
    }

    return (
      <Panel id={this.props.id}>
        {this._renderWrap()}
      </Panel>
    )
  }

  _renderWrap() {
    return (
      <div>
        <Header
          left={<UICloseButton />}
        >
          Уведомления
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
      <FormLayout>
        <FormLayoutGroup>
          <Checkbox checked={this.data.settings.message} onChange={(e) => this._onChange('message', e.target.checked)}>Новые сообщения</Checkbox>
          <Checkbox checked={this.data.settings.match} onChange={(e) => this._onChange('match', e.target.checked)}>Новые пары</Checkbox>
          <Checkbox checked={this.data.settings.gift} onChange={(e) => this._onChange('gift', e.target.checked)}>Новые подарки</Checkbox>
          <Checkbox checked={this.data.settings.like} onChange={(e) => this._onChange('like', e.target.checked)}>Новые лайки</Checkbox>
          <Checkbox checked={this.data.settings.guest} onChange={(e) => this._onChange('guest', e.target.checked)}>Новые гости</Checkbox>
        </FormLayoutGroup>
        <Button size="xl" level="1" onClick={this._saveButtonDidPress}>Сохранить</Button>
      </FormLayout>
    )
  }

  _onChange(field, checked) {
    const settings = this.data.settings;
    settings[field] = checked;
    this.setData('settings', settings);
  }

  _saveButtonDidPress = () => {
    accountActions.saveNotifySettings();
  };

  _load = () => {
    accountActions.loadNotifySettings();
  };
}
