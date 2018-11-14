import './LiveChats.css';

import React, { Component } from 'react';
import { Group, PanelHeader, Button, Div } from '@vkontakte/vkui';
import * as actions from '../../actions/index';
import * as cardsActions from "../../actions/cards";
import BaseComponent from '../../BaseComponent';
import * as utils from '../../utils';

export default class DateChats extends Component {
  componentDidMount() {
    utils.statReachGoal('live_chats');
  }

  render() {
    return (
      <div>
        <PanelHeader>
          Live Chats
        </PanelHeader>
        <Group description="Внимание! Сервис находится в beta тестировании.">
          <Div>
            <div className="Join__intro">
              <div className="LiveChats__intro-image" />
              <div className="Join__intro-title" style={{marginTop: '26px'}}>Знакомства здесь и сейчас</div>
              <div className="Join__intro-caption">Нажмите «Лайк», если человек вам понравился, после взаимного лайка между вами появится постоянный чат в разделе «Активность».</div>
            </div>
          </Div>
          <Div>
            <Button size="xl" level="1" onClick={actions.openLiveChat}>Найти собеседника</Button>
          </Div>
        </Group>
      </div>
    )
  }
}
