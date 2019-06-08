import './Utils.css';
import React from 'react';
import BaseComponent from '../../BaseComponent';
import * as actions from '../../actions';
import * as utilsActions from '../../actions/utils';
import { Panel, PanelHeader, platform, FixedLayout, List, Cell, Div, Spinner, colors, Search, HeaderButton } from '@vkontakte/vkui';
import Icon24Done from '@vkontakte/icons/dist/24/done';
import {IOS} from "@vkontakte/vkui/dist/vkui";
import Header from '../../components/proxy/Header';

const osname = platform();

export default class SelectCity extends BaseComponent {
  constructor() {
    super();

    this.state = {
      cities: [],
      isFailed: false,
      isLoading: false,
      search: ''
    };
  }

  componentDidMount() {
    this._searchCity('', true);
  }

  render() {
    if (window.isDesktop) {
      return (
        <div>{this._renderCont()}</div>
      )
    }

    return (
      <Panel id={this.props.id}>{this._renderCont()}</Panel>
    )
  }

  _renderCont() {
    return (
      <div>
        <Header
          left={<HeaderButton onClick={() => window.history.back()}>Отмена</HeaderButton>}
        >
          Выбор города
        </Header>
        <FixedLayout vertical="top">
          <Search onChange={this._searchCity} maxLength={80} />
        </FixedLayout>
        <div style={{paddingTop: osname === IOS ? 48 : 56}}>
          {this._renderContent()}
        </div>
      </div>
    )
  }

  _renderContent() {
    if (this.state.isLoading) {
      return <Div><Spinner/></Div>;
    }

    if (this.state.isFailed) {
      return <Div>Произошла ошибка</Div>;
    }

    if (this.state.cities.length === 0) {
      return <div className="Likes__empty">Ничего не найдено</div>
    }

    return (
      <List>
        {this._renderCities()}
      </List>
    )
  }

  _renderCities() {
    const activeCountry = this.props.state.pageData[this.data.page] ? this.props.state.pageData[this.data.page][this.data.field] || {} : {};
    return this.state.cities.map(city => {
      let extra = [];
      if (city.region) {
        extra.push(city.region);
      }
      if (city.area) {
        extra.push(city.area);
      }
      return (
        <Cell
          key={city.id}
          onClick={() => this._itemDidPress(city)}
          asideContent={activeCountry.id === city.id ? <Icon24Done fill={colors.accentBlue} /> : null}
        >
          <div>{city.title}</div>
          {extra.length > 0 && <div className="Utils__search_city-extra">{extra.join(', ')}</div>}
        </Cell>
      )
    });
  }

  _itemDidPress = (item) => {
    actions.setData(this.data.field, item, this.data.page);
    window.history.back();
  };

  _searchCity = (query = '', fast = false) => {
    this.setState({isLoading: true, isFailed: false});
    query = query.trim();
    this.lastQuery = query;
    utilsActions.loadCities(this.data.countryId, query, fast)
      .then(([cities, q]) => {
        if (q !== this.lastQuery) {
          return;
        }
        this.setState({cities, isLoading: false});
      })
      .catch(() => this.setState({isFailed: true, isLoading: false}))
  };
}