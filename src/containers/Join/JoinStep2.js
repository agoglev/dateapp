import './Join.css';

import React from 'react';
import BaseComponent from '../../BaseComponent';
import * as actions from '../../actions';
import * as accountActions from '../../actions/account';
import * as pages from '../../constants/pages';
import { Panel, FormLayout, SelectMimicry, Button } from '@vkontakte/vkui';
import * as utils from "../../utils";
import UIBackButton from '../../components/UI/UIBackButton';
import Header from '../../components/proxy/Header';

export default class JoinStep1 extends BaseComponent {
  constructor() {
    super();
  }

  componentDidMount() {
    utils.statReachGoal('join_step2');
  }

  render() {
    if (window.isDesktop) {
      return <div>{this._renderContent()}</div>;
    }

    return <Panel id={this.props.id}>{this._renderContent()}</Panel>;
  }

  _renderContent() {
    const country = this.data.country || {};

    return (
      <div>
        <Header
          left={<UIBackButton />}
        >
          Откуда Вы?
        </Header>
        <FormLayout>
          <SelectMimicry
            top="Выберите страну"
            placeholder="Не выбрана"
            onClick={() => actions.go(pages.SELECT_COUNTRY, {page: pages.JOIN_STEP2, field: 'country'})}
          >{country.title}</SelectMimicry>
          {this._renderCity()}
          <Button size="xl" level="1" onClick={this.continueButtonDidPress}>Далее</Button>
        </FormLayout>
      </div>
    )
  }

  _renderCity() {
    if (!this.data.country) {
      return null;
    }

    const city = this.data.city || {};
    return (
      <SelectMimicry
        top="Выберите город"
        placeholder="Не выбран"
        onClick={() => actions.go(pages.SELECT_CITY, {page: pages.JOIN_STEP2, field: 'city', countryId: this.data.country.id})}
      >{city.title}</SelectMimicry>
    )
  }

  continueButtonDidPress = () => {
    const country = this.data.country || {};
    const city = this.data.city || {};

    accountActions.fillJoinInfo({
      country: country.id,
      city: city.id,
    });
    actions.openJoinStep3();
  };
}
