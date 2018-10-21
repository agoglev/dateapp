import React from 'react';
import BaseComponent from '../../BaseComponent';
import * as actions from '../../actions';
import * as utilsActions from '../../actions/utils';
import { Panel, PanelHeader, platform, Group, List, Cell, Div, Spinner, colors, HeaderButton } from '@vkontakte/vkui';
import Icon24Done from '@vkontakte/icons/dist/24/done';

const osname = platform();

export default class SelectCountry extends BaseComponent {
  constructor() {
    super();

    this.state = {
      countries: false,
      isFailed: false
    };
  }

  componentDidMount() {
    utilsActions.loadCountries()
      .then((countries) => this.setState({countries}))
      .catch(() => this.setState({isFailed: true}));
  }

  render() {
    return (
      <Panel id={this.props.id}>
        <PanelHeader
          left={<HeaderButton onClick={() => window.history.back()}>Отмена</HeaderButton>}
        >
          Выбор страны
        </PanelHeader>
        {this._renderContent()}
      </Panel>
    )
  }

  _renderContent() {
    if (!this.state.countries) {
      return <Div><Spinner/></Div>;
    }

    if (this.state.isFailed) {
      return <Div>Произошла ошибка</Div>;
    }

    return (
      <Group>
        <List>
          {this._renderCountries()}
        </List>
      </Group>
    )
  }

  _renderCountries() {
    const activeCountry = this.props.state.pageData[this.data.page] ? this.props.state.pageData[this.data.page][this.data.field] || {} : {};
    return this.state.countries.map(country => {
      return (
        <Cell
          key={country.id}
          onClick={() => this._itemDidPress(country)}
          asideContent={activeCountry.id === country.id ? <Icon24Done fill={colors.accentBlue} /> : null}
        >
          {country.title}
        </Cell>
      )
    });
  }

  _itemDidPress = (item) => {
    actions.setData(this.data.field, item, this.data.page);
    actions.setData('city', false, this.data.page);
    window.history.back();
  };
}