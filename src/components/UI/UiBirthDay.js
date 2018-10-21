import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as utils from '../../utils';
import { Panel, PanelHeader, FormLayout, platform, IOS, HeaderButton, Input, Select } from '@vkontakte/vkui';


export default class UiBirthDay extends Component {
  static propTypes = {
    day: PropTypes.number,
    month: PropTypes.number,
    year: PropTypes.number,
    onChange: PropTypes.func
  };

  render() {
    return (
      <div className="Join__birthday-wrap">
        <Select
          defaultValue={this.props.day}
          getRef={(ref) => this.dayRef = ref}
          onChange={() => this.props.onChange && this.props.onChange(this.getData())}
        >
          {this._getDays()}
        </Select>
        <Select
          defaultValue={this.props.month}
          getRef={(ref) => this.monthRef = ref}
          onChange={() => this.props.onChange && this.props.onChange(this.getData())}
        >
          {this._getMonths()}
        </Select>
        <Select
          defaultValue={this.props.year}
          getRef={(ref) => this.yearRef = ref}
          onChange={() => this.props.onChange && this.props.onChange(this.getData())}
        >
          {this._getYears()}
        </Select>
      </div>
    );
  }

  onClick = () => {
    const checked = !this.state.checked;
    this.setState({checked});
    this.props.onChange && this.props.onChange(checked);
  };

  _getDays() {
    const daysForMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let result = [];
    const month = this.monthRef ? parseInt(this.monthRef.value, 10) : parseInt(this.props.month, 10);
    for (let i = 1; i <= daysForMonth[month]; i++) {
      result.push(<option key={i} value={i}>{i}</option>);
    }
    return result;
  }

  _getMonths() {
    const months = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];
    let result = [];
    for (let i = 0; i < months.length; i++) {
      result.push(<option key={i} value={i}>{months[i]}</option>);
    }
    return result;
  }

  _getYears() {
    const curYear = new Date().getFullYear();
    let result = [];
    for (let i = curYear - 18; i >= curYear - 90; i--) {
      result.push(<option key={i} value={i}>{i}</option>);
    }
    return result;
  }

  getData() {
    return {
      day: parseInt(this.dayRef.value, 10),
      month: parseInt(this.monthRef.value, 10),
      year: parseInt(this.yearRef.value, 10)
    };
  }
}
