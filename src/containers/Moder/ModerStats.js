import './Moder.css';

import React from 'react';
import BaseComponent from '../../BaseComponent';
import Header from '../../components/proxy/Header';
import * as UI from '@vkontakte/vkui';
import UICloseButton from '../../components/UI/UICloseButton';
import * as moderActions from '../../actions/moder';
import * as utils from '../../utils';
import * as actions from "../../actions";
import Icon24Poll from '@vkontakte/icons/dist/24/poll';

export default class ModerStats extends BaseComponent {
  render() {
    if (window.isDesktop) {
      return this._renderCont();
    }

    return (
      <UI.Panel id={this.props.id}>
        {this._renderCont()}
      </UI.Panel>
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
      return <div className="Activity__loader"><UI.Spinner/></div>;
    }

    if (this.data.isFailed) {
      return <div className="Activity__failed">
        <div className="Activity__failed_msg">Произошла ошибка</div>
        <UI.Button size="l" onClick={this._load}>Повторить</UI.Button>
      </div>;
    }

    return (this.data.stats || []).map((item) => {

      return (
        <UI.Group key={item.user.id}>
          <UI.Div>
            <UI.InfoRow title="Модератор">
              {item.user.name} ID: {item.user.id}
            </UI.InfoRow>
            <UI.InfoRow title="Общее количество">
              {item.total_count}
            </UI.InfoRow>
            {item.avail_count && <UI.InfoRow title="Доступно">
              {item.avail_count}
            </UI.InfoRow>}
          </UI.Div>
        </UI.Group>
      )
    });
  }

  _load = () => {
    moderActions.loadStats();
  };
}
