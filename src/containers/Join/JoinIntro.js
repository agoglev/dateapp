import './Join.css'

import React from 'react';
import BaseComponent from '../../BaseComponent';
import { Div, Group, Button } from '@vkontakte/vkui';
import * as actions from '../../actions';
import * as pages from '../../constants/pages';
import * as utils from '../../utils';
import Header from '../../components/proxy/Header';

export default class JoinIntro extends BaseComponent {
  componentDidMount() {
    utils.statReachGoal('join_intro');
  }

  render() {
    return (
      <div>
        <Header>
          Знакомства
        </Header>
        <Group>
          <Div>
            <div className="Join__intro-art-wrap">
              <div className="Join__intro-art" />
            </div>
            <div className="Join__intro">
              <div className="Join__intro-title">Знакомиться просто</div>
              <div className="Join__intro-caption">Поможем познакомиться с новыми интересными людьми, начать общение, а может, и нечто большее.</div>
            </div>
          </Div>
          <Div>
            <Button size="xl" level="1" onClick={() => actions.go(pages.JOIN_STEP1)}>Заполнить анкету</Button>
          </Div>
        </Group>
      </div>
    )
  }
}