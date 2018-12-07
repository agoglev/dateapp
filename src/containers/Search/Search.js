import './Search.css';

import React, { Component, PureComponent } from 'react';
import { HeaderButton, HeaderContext, FormLayout, Button, SelectMimicry, RangeSlider, Spinner } from '@vkontakte/vkui';
import * as actions from '../../actions/index';
import * as searchActions from '../../actions/search';
import * as accountActions from '../../actions/account';
import * as utils from '../../utils/index';
import * as pages from "../../constants/pages";
import BaseComponent from '../../BaseComponent';
import Icon24Filter from '@vkontakte/icons/dist/24/filter';
import Icon24Cancel from '@vkontakte/icons/dist/24/cancel';
import SegmentedControl from "../../components/SegmentedControl/SegmentedControl";
import Header from '../../components/proxy/Header';

export default class Search extends BaseComponent {
  constructor() {
    super();

    this.state = {
      filtersOpened: false
    }
  }
  componentDidMount() {
    this.refs['wrap'].style.paddingBottom = (utils.getTabBarHeight() + 16) + 'px';
    searchActions.init();
  }

  render() {
    const genders = [
      {
        id: 'mans',
        text: 'Парни'
      },
      {
        id: 'girls',
        text: 'Девушки'
      },
      {
        id: 'all',
        text: 'Все'
      }
    ];

    const sortBy = [
      {
        id: 'all',
        text: 'Всех'
      },
      {
        id: 'online',
        text: 'Онлайн'
      },
      {
        id: 'new',
        text: 'Новых'
      }
    ];

    const info = this.props.state.usersInfo[this.props.state.userId];
    const cityName = String(info.city_name).length > 0 ? `${info.city_name}` : '';
    return (
      <div ref="wrap">
        <Header
          left={this._renderFiltersButton()}
        >
          {this.data.filtersOpened ? 'Фильтры' : 'Люди'}
        </Header>
        <HeaderContext opened={this.data.filtersOpened} onClose={this._toggleFilters}>
          <div className="Search__filters">
            <FormLayout>
              <SelectMimicry
                top="Местоположение"
                bottom={<span>Вы можете изменить город в <span className="Link" onClick={() => {
                  actions.openEditProfile();
                  return false;
                }}>редактировании анкеты</span></span>}
                placeholder="Не выбран"
                onClick={() => actions.openEditProfile()}
              >{cityName}</SelectMimicry>
              <div top="Меня интересуют">
                <SegmentedControl
                  selected={this.data.filterGender}
                  items={genders}
                  onSelect={(gender) => this.setData('filterGender', gender)}
                />
              </div>
              <div top="Показывать">
                <SegmentedControl
                  selected={this.data.filterSort}
                  items={sortBy}
                  onSelect={(sort) => this.setData('filterSort', sort)}
                />
              </div>
              <div top="Возраст" bottom={this._renderFiltersLabel()}>
                <RangeSlider
                  min={17}
                  max={55}
                  step={1}
                  onChange={(val) => {
                    this.setData('ageFrom', val[0]);
                    this.setData('ageTo', val[1]);
                  }}
                  value={[this.data.ageFrom, this.data.ageTo]}
                />
              </div>
            </FormLayout>
          </div>
        </HeaderContext>
        <div className="Likes__items clear_fix">
          {this._renderItems()}
        </div>
        {this._renderLoadMoreButton()}
      </div>
    )
  }

  _renderItems() {
    if (this.data.isLoading) {
      return <div className="Activity__loader"><Spinner/></div>;
    }

    if (this.data.isFailed) {
      return <div className="Activity__failed">
        <div className="Activity__failed_msg">Произошла ошибка</div>
        <Button size="l" onClick={this._load}>Повторить</Button>
      </div>;
    }

    if (!this.data.users || !this.data.users.length) {
      return <div className="Activity__failed">
        <div className="Activity__failed_msg">По вашему запросу нет пользователей</div>
        <Button size="l" onClick={this._toggleFilters}>Изменить настройки</Button>
      </div>;
    }

    const now = Math.floor(new Date().getTime() / 1000);
    return this.data.users.map((user) => {
      const className = utils.classNames({
        Likes__user_row: true,
      });
      const isOnline = now - user.last_update < 60 * 15;
      return (
        <div
          className={className}
          key={user.id}
          onClick={() => actions.go(pages.PROFILE, {user, fromSearch: true})}
        >
          <div className="Likes__user-row__cont" style={{backgroundImage: `url(${user.small_photo})`}}>
            <div className="Likes__user-row__name-wrap">
              <div className="Likes__user-row__name">{user.name}</div>
              {isOnline && <div className="Likes__user-row__name__online" />}
            </div>
          </div>
        </div>
      )
    });
  }

  _renderFiltersButton() {
    return (
      <HeaderButton onClick={this._toggleFilters}>
        {this.data.filtersOpened ? <Icon24Cancel /> : <Icon24Filter />}
      </HeaderButton>
    )
  }

  _toggleFilters = () => {
    if (this.data.filtersOpened) {
      actions.loaderShow();
      accountActions.saveSearchFilters(this.data.filterGender, this.data.filterSort, this.data.ageFrom, this.data.ageTo).then(() => {
        this._load();
        actions.loaderSuccess();
        this.setData('filtersOpened', false);
      }).catch(() => actions.showError());
    } else {
      this.setData('filtersOpened', true);
    }
  };

  _renderFiltersLabel() {
    if (this.data.ageFrom < 18 && this.data.ageTo > 54) {
      return 'все';
    } else if (this.data.ageFrom < 18) {
      return `до ${this.data.ageTo}`;
    } else if (this.data.ageTo > 54) {
      return `от ${this.data.ageFrom}`;
    } else {
      return `от ${this.data.ageFrom} до ${this.data.ageTo}`;
    }
  }

  _renderLoadMoreButton() {
    if (this.data.isLoading || this.data.isFailed || !this.data.nextFrom) {
      return null;
    }

    return (
      <div className="Likes__load-more-wrap" onClick={this._loadMore}>
        <div className="Likes__load-more">{this.data.isLoadingMore ? 'Загрузка..' : 'Показать больше'}</div>
      </div>
    )
  }

  _load = () => {
    searchActions.load();
  };

  _loadMore = () => {
    searchActions.loadMore();
  };
}
