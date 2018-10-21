import './Join.css'

import React from 'react';
import BaseComponent from '../../BaseComponent';
import { PanelHeader, Div, Group, Button } from '@vkontakte/vkui';
import * as actions from '../../actions';
import * as pages from '../../constants/pages';
import * as utils from '../../utils';

export default class JoinIntro extends BaseComponent {
  componentDidMount() {
    utils.statReachGoal('join_intro');
  }

  render() {
    return (
      <div>
        <PanelHeader>
          Знакомства
        </PanelHeader>
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