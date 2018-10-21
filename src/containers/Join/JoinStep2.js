import './Join.css';

import React from 'react';
import BaseComponent from '../../BaseComponent';
import * as actions from '../../actions';
import * as accountActions from '../../actions/account';
import * as pages from '../../constants/pages';
import { Panel, PanelHeader, FormLayout, SelectMimicry, Button } from '@vkontakte/vkui';
import * as utils from "../../utils";
import UIBackButton from '../../components/UI/UIBackButton';

export default class JoinStep1 extends BaseComponent {
  constructor() {
    super();
  }

  componentDidMount() {
    utils.statReachGoal('join_step2');
  }

  render() {
    const country = this.data.country || {};
    return (
      <Panel id={this.props.id}>
        <PanelHeader
          left={<UIBackButton />}
        >
          Откуда вы?
        </PanelHeader>
        <FormLayout>
          <SelectMimicry
            top="Выберите страну"
            placeholder="Не выбрана"
            onClick={() => actions.go(pages.SELECT_COUNTRY, {page: pages.JOIN_STEP2, field: 'country'})}
          >{country.title}</SelectMimicry>
          {this._renderCity()}
          <Button size="xl" level="1" onClick={this.continueButtonDidPress}>Далее</Button>
        </FormLayout>
      </Panel>
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
