import './Moder.css';

import React from 'react';
import BaseComponent from '../../BaseComponent';
import Header from '../../components/proxy/Header';
import { Panel, Group, Spinner, Button, Search, Tabs, TabsItem, HorizontalScroll, Div, Input, FormLayout } from '@vkontakte/vkui';
import UICloseButton from '../../components/UI/UICloseButton';
import * as moderActions from '../../actions/moder';
import * as utils from '../../utils';
import * as actions from "../../actions";
import Icon24Poll from '@vkontakte/icons/dist/24/poll';
import Icon24Search from '@vkontakte/icons/dist/24/search';

export default class Moder extends BaseComponent {
  constructor(props) {
    super(props);

    this.state = {
      messages: [],
      messagesId: null,
      searchMode: false,
      searchQuery: '',
      searchLoading: false,
    };
  }

  render() {
    if (window.isDesktop) {
      return this._renderCont();
    }

    return (
      <Panel id={this.props.id}>
        {!this.state.searchMode && <Div className="Moder__reports__top_buttons">
          <Button before={<Icon24Poll/>} size="xl" onClick={() => actions.openModerStats()}>Статистика</Button>
          <Button before={<Icon24Search/>} size="xl" onClick={() => this.setState({ searchMode: true })}>Поиск</Button>
        </Div>}
        {this._renderCont()}
      </Panel>
    )
  }

  _renderCont() {
    if (this.state.searchMode) {
      return (
        <div>
          <Header
            left={<UICloseButton />}
          >
            Поиск
          </Header>
          <FormLayout TagName="div" style={{paddingBottom: 77}} onSubmit={(e) => {
            e.preventDefault();
            return false;
          }}>
            <Input
              placeholder="ID страницы"
              value={this.state.searchQuery}
              onChange={(e) => this.setState({ searchQuery: e.target.value })}
            />
            <Button size="xl" onClick={() => this.__search()}>Найти</Button>
            {this.state.foundUser && this.__renderItem(this.state.foundUser)}
          </FormLayout>
        </div>
      )
    }

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

  __search = () => {
    const id = parseInt(this.state.searchQuery.trim());
    if (!id) {
      return;
    }

    moderActions.loadUser(id).then((user) => {
      this.setState({ foundUser: user });
    });
  };

  _renderContent() {
    /*
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
     */

    return (
      <div>
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

    return this.data.reports.map((report) => this.__renderItem(report));
  }

  __renderItem(report) {
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
          {report.user.ban_message && <div className="Moder__reports__item__about">{report.user.ban_message}</div>}
          {info.length > 0 && <div className="Moder__reports__item__info">{info.join(', ')}</div>}
          <div className="Moder__reports__item__summary"><b>Количество жалоб:</b> {report.reports_count}</div>
          <div className="Moder__reports__item__actions">
            <Button onClick={() => this._skipButtonDidPress(report)}>Пропустить</Button>
            <Button onClick={() => this._banButtonDidPress(report)}>Заблокировать</Button>
          </div>
          <div className="Moder__reports__item__actions">
            {this.__renderMessages(report)}
          </div>
        </div>
      </Group>
    )
  }

  __renderMessages(report) {
    if (this.state.messagesId !== report.id) {
      return <Button onClick={() => this._lastMessages(report)}>Последние сообщения</Button>;
    } else {
      return (
        <div>
          {this.state.messages.map((row, i) => <div key={i}>{row.text}</div>)}
          <Button onClick={() => this.setState({ messagesId: null, messages: [] })}>Скрыть</Button>
        </div>
      )
    }
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
    this.setState({ messagesId: null, messages: [] });
  }

  _banButtonDidPress(report) {
    moderActions.banReport(report);
    this.setState({ messagesId: null, messages: [] });
  }

  _lastMessages(report) {
    moderActions.loadMessages(report).then((messages) => {
      this.setState({
        messagesId: report.id,
        messages
      });
    }).catch(() => console.log('err'));
  }

  _restoreButtonDidPress(report) {
    moderActions.restoreReport(report);
  }

  _setType(type) {
    this.setData('type', type);
    moderActions.loadReports(type, this.data.query);
  }
}
