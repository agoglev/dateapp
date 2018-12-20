import './Moder.css';

import React from 'react';
import BaseComponent from '../../BaseComponent';
import Header from '../../components/proxy/Header';
import { Panel, Group, Spinner, Button, Search, Tabs, TabsItem, HorizontalScroll } from '@vkontakte/vkui';
import UICloseButton from '../../components/UI/UICloseButton';
import * as moderActions from '../../actions/moder';
import * as actions from '../../actions';
import * as utils from '../../utils';

export default class Moder extends BaseComponent {
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
          Модерация
        </Header>
        {this._renderContent()}
      </div>
    )
  }

  _renderContent() {
    return (
      <div>
        <Search onChange={this._searchReports} />
        <Group>
          <Tabs type="buttons">
            <HorizontalScroll>
              <TabsItem onClick={() => this._setType('all')} selected={this.data.type === 'all'}>Все</TabsItem>
              <TabsItem onClick={() => this._setType('template')} selected={this.data.type === 'template'}>Шаблон</TabsItem>
              <TabsItem onClick={() => this._setType('banned')} selected={this.data.type === 'banned'}>Заблокированные</TabsItem>
            </HorizontalScroll>
          </Tabs>
        </Group>
        {this._renderRows()}
        {!this.data.isLoading && !this.data.isFailed && <div className="Likes__load-more-wrap" onClick={this._load}>
          <div className="Likes__load-more">Обновить</div>
          </div>}
      </div>
    )
  }

  _renderRows() {
    if (this.data.isLoading) {
      return <div className="Activity__loader"><Spinner/></div>;
    }

    if (this.data.isFailed) {
      return <div className="Activity__failed">
        <div className="Activity__failed_msg">Произошла ошибка</div>
        <Button size="l" onClick={this._load}>Повторить</Button>
      </div>;
    }

    return this.data.reports.map((report) => {
      if (report.isSkipped || report.isBanned) {
        const text = report.isSkipped ? `${report.user.name} пропущен(а)` : `${report.user.name} заблокирован(а)`;
        return (
          <Group key={report.user.id}>
            <div className="Moder__reports__item_resolved">
              <div>{text}</div>
              <Button onClick={() => this._restoreButtonDidPress(report)}>Отменить</Button>
            </div>
          </Group>
        )
      }

      let info = [];
      if (report.user.education) {
        info.push(`Образование: ${report.user.education}`);
      }

      if (report.user.job) {
        info.push(`Работа: ${report.user.job}`);
      }

      return (
        <Group key={report.user.id}>
          <div className="Moder__reports__item">
            <div className="Moder__reports__item__photos clear_fix">{this._renderPhotos(report.user)}</div>
            <div className="Moder__reports__item__name">{report.user.name}</div>
            <div className="Moder__reports__item__about">{report.user.about}</div>
            {info.length > 0 && <div className="Moder__reports__item__info">{info.join(', ')}</div>}
            <div className="Moder__reports__item__summary"><b>Количество жалоб:</b> {report.reports_count}</div>
            <div className="Moder__reports__item__actions">
              <Button onClick={() => this._skipButtonDidPress(report)}>Пропустить</Button>
              <Button onClick={() => this._banButtonDidPress(report)}>Заблокировать</Button>
            </div>
          </div>
        </Group>
      )
    });
  }

  _renderPhotos(user) {
    return user.photos.map((photo) => {
      return (
        <div
          className="Moder__reports__item__photo"
          key={photo.id}
          style={{backgroundImage: `url(${photo.photo400})`}}
        />
      )
    });
  }

  _searchReports = (query = '') => {
    if (this.data.type === 'template') {
      return;
    }
    utils.throttle('moder_search', () => {
      query = query.trim();
      moderActions.loadReports(this.data.type, query);
      this.setData('query', query);
    }, 2000);
  };

  _load = () => {
    moderActions.loadReports(this.data.type, this.data.query);
  };

  _skipButtonDidPress(report) {
    moderActions.skipReport(report);
  }

  _banButtonDidPress(report) {
    moderActions.banReport(report);
  }

  _restoreButtonDidPress(report) {
    moderActions.restoreReport(report);
  }

  _setType(type) {
    this.setData('type', type);
    moderActions.loadReports(type, this.data.query);
  }
}
