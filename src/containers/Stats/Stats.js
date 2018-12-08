import './Stats.css';

import React from 'react';
import BaseComponent from '../../BaseComponent';
import Header from '../../components/proxy/Header';
import Graph from '../../components/Graph/Graph';
import { Panel, Group, Spinner, Button } from '@vkontakte/vkui';
import * as accountActions from '../../actions/account';
import UICloseButton from '../../components/UI/UICloseButton';
import { ProfileButton } from '../Profile/Profile';
import * as payments from "../../actions/payments";

export default class Stats extends BaseComponent {
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
          Статистика
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
      <div>
        <Group>
          <div className="Stats__popularity">Популярность: {this._renderLevel()}</div>
          <Graph
            stats={this.data.stats}
            selected={this.data.selected}
            onChange={(index) => this.setData('selected', index)}
          />
          {this._renderStat()}
        </Group>
        <Group>
          <div className="Stats__promote-features">
            <ProfileButton type="like" onClick={() => payments.showFeatureBox()}>Получить больше лайков</ProfileButton>
          </div>
        </Group>
      </div>
    )
  }

  _load = () => {
    accountActions.loadStats();
  };

  _renderStat() {
    const stat = this.data.stats[this.data.selected];
    return (
      <div className="Stats__info">
        Новые лайки: {stat.likes}, Новые посетители: {stat.profile_view}
      </div>
    )
  }

  _renderLevel() {
    let label = 'Средняя';
    let extraClass = '';

    if (this.data.level === -1) {
      label = 'Низкая';
      extraClass = 'low';
    } else if (this.data.level === 1) {
      label = 'Высокая';
      extraClass = 'high';
    }

    return (
      <span className={`Stats__level ${extraClass}`}>{label}</span>
    )
  }
}
