import React from 'react';
import { Panel, PanelHeader, FormLayout, Input, Select, SelectMimicry, FixedLayout, Button, Textarea, Checkbox, Group, List, Cell } from '@vkontakte/vkui';
import * as actions from '../../actions/index';
import * as utils from '../../utils/index';
import * as pages from "../../constants/pages";
import * as cardsActions from "../../actions/cards";
import UiBirthDay from '../../components/UI/UiBirthDay';
import * as api from '../../services/api';
import UICloseButton from '../../components/UI/UICloseButton';
import UploadPhotoComponent from '../../components/UploadPhotoComponent/UploadPhotoComponent';
import Header from '../../components/proxy/Header';

export default class EditProfile extends UploadPhotoComponent {
  render() {
    if (window.isDesktop) {
      return (
        <div>
          {this._renderContent()}
        </div>
      )
    }

    return (
      <Panel id={this.props.id}>
        {this._renderContent()}
      </Panel>
    )
  }

  _renderContent() {
    if (!this.data.photos) {
      return null;
    }
    return (
      <div>
        <Header
          left={<UICloseButton />}
        >
          Редактирование
        </Header>
        <FormLayout TagName="div" style={{paddingBottom: 77}} onSubmit={(e) => {
          e.preventDefault();
          return false;
        }}>
          <div style={{padding: '0 6px'}} top="Фотографии" bottom="Загрузите свои настоящие фотографии">
            <div className="profile_edit_photos">
              {this._renderPhotos()}
            </div>
          </div>
          <Input
            top="Имя"
            value={this.data.name}
            onChange={(e) => this.setData('name', e.target.value)}
            maxLength={60}
          />
          <div top="Дата рождения">
            <UiBirthDay
              day={this.data.birthday.day}
              month={this.data.birthday.month}
              year={this.data.birthday.year}
              onChange={(val) => this.setData('birthday', val)}
            />
          </div>
          <Select
            top="Пол"
            value={this.data.gender}
            onChange={(e) => this.setData('gender', parseInt(e.target.value, 10))}
          >
            <option value="1">Женский</option>
            <option value="2">Мужской</option>
          </Select>
          <SelectMimicry
            top="Выберите страну"
            placeholder="Не выбрана"
            onClick={() => actions.go(pages.SELECT_COUNTRY, {page: this.props.id, field: 'country'})}
          >{this.data.country.title}</SelectMimicry>
          {this._renderCity()}
          <Select
            top="Я хочу.."
            value={this.data.purpose}
            onChange={(e) => this.setData('purpose', parseInt(e.target.value, 10) || 0)}
            placeholder="Не выбрано"
          >
            <option value="1">Найти новых друзей</option>
            <option value="2">Общаться</option>
            <option value="3">Пойти на свидание</option>
          </Select>
          <Input
            top="Работа"
            value={this.data.job}
            onChange={(e) => this.setData('job', e.target.value)}
            maxLength={150}
          />
          <Input
            top="Образование"
            value={this.data.education}
            onChange={(e) => this.setData('education', e.target.value)}
            maxLength={150}
          />
          <Textarea
            top="О себе"
            value={this.data.about}
            onChange={(e) => this.setData('about', e.target.value)}
            maxLength={400}
          />
          <Group title="Дополнительная информация">
            <List>
              <Cell expandable onClick={() => actions.openExtraInfoEdit('children')} indicator={this._infoIndicatorMapping('children')}>Дети</Cell>
              <Cell expandable onClick={() => actions.openExtraInfoEdit('alcohol')} indicator={this._infoIndicatorMapping('alcohol')}>Алкоголь</Cell>
              <Cell expandable onClick={() => actions.openExtraInfoEdit('home')} indicator={this._infoIndicatorMapping('home')}>Я живу</Cell>
              <Cell expandable onClick={() => actions.openExtraInfoEdit('relations')} indicator={this._infoIndicatorMapping('relations')}>Отношения</Cell>
              <Cell expandable onClick={() => actions.openExtraInfoEdit('gender')} indicator={this._infoIndicatorMapping('gender')}>Ориентация</Cell>
              <Cell expandable onClick={() => actions.openExtraInfoEdit('smoke')} indicator={this._infoIndicatorMapping('smoke')}>Курение</Cell>
            </List>
          </Group>
          <FixedLayout vertical="bottom" className="Join__footer_btn_wrap">
            <Button size="xl" level="1" onClick={this._saveButtonDidPress} style={{margin: '16px 12px'}}>Сохранить</Button>
          </FixedLayout>
        </FormLayout>
      </div>
    )
  }

  _infoIndicatorMapping(type) {
    const userInfo = this.props.state.usersInfo[this.props.state.userId] || {};
    switch (type) {
      case 'children': {
        const children = parseInt(userInfo.extra.children, 10);
        if (children === 1 || children === 2) {
          return 'Есть';
        } else if (children === 3 || children === 4) {
          return 'Нет';
        } else {
          return 'Выбрать';
        }
      }

      case 'alcohol': {
        const alcohol = parseInt(userInfo.extra.alcohol, 10);
        if (alcohol === 1) {
          return 'За компанию';
        } else if (alcohol === 2 || alcohol === 3) {
          return 'Нет';
        } else if (alcohol === 4) {
          return 'Да';
        } else {
          return 'Выбрать';
        }
      }

      case 'home': {
        const home = parseInt(userInfo.extra.home, 10);
        if (home === 1) {
          return userInfo.gender === 1 ? 'Одна' : 'Один';
        } else if (home === 2) {
          return 'В общежитии';
        } else if (home === 3) {
          return 'С родителями';
        } else if (home === 4) {
          return 'Со второй половиной';
        } else if (home === 5) {
          return 'С соседями';
        } else {
          return 'Выбрать';
        }
      }

      case 'relations': {
        const relations = parseInt(userInfo.extra.relations, 10);
        if (relations === 1) {
          return 'Все сложно';
        } else if (relations === 2) {
          return userInfo.gender === 1 ? 'Свободна' : 'Свободен';
        } else if (relations === 3) {
          return userInfo.gender === 1 ? 'Занята' : 'Занят';
        } else {
          return 'Выбрать';
        }
      }

      case 'gender': {
        const gender = parseInt(userInfo.extra.gender, 10);
        if (gender === 1) {
          return 'Би';
        } else if (gender === 2) {
          return userInfo.gender === 1 ? 'Лесби' : 'Гей';
        } else if (gender === 3) {
          return 'Спросите меня';
        } else if (gender === 4) {
          return 'Гетеро';
        } else {
          return 'Выбрать';
        }
      }

      case 'smoke': {
        const smoke = parseInt(userInfo.extra.smoke, 10);

        if (smoke === 1) {
          return 'Да';
        } else if (smoke === 2 || smoke === 3) {
          return 'Нет';
        } else if (smoke === 4) {
          return 'За компанию';
        } else if (smoke === 5) {
          return 'Иногда';
        } else {
          return 'Выбрать';
        }
      }
    }
  }

  _renderCity() {
    if (!this.data.country) {
      return null;
    }

    return (
      <SelectMimicry
        top="Выберите город"
        placeholder="Не выбран"
        onClick={() => actions.go(pages.SELECT_CITY, {page: this.props.id, field: 'city', countryId: this.data.country.id})}
      >{this.data.city.title}</SelectMimicry>
    )
  }

  _saveButtonDidPress = () => {
    const name = utils.stripHTML(this.data.name.trim());

    if (!name.match(/^[a-zа-я]+$/i)) {
      return actions.showAlert('Не верное имя', <span>У нас принято использовать <b>настоящее имя</b>, написанное русскими или латинскими буквами. Например: Анна, Иван, Anna, Ivan.</span>, 'OK', {
        skipCancelButton: true
      });
    }

    const gender = this.data.gender;
    const birthdays = this.data.birthday;
    const country = this.data.country || {};
    const city = this.data.city || {};
    const purpose = this.data.purpose;
    const job = this.data.job;
    const education = this.data.education;
    const about = this.data.about;

    if (!name) {
      return actions.showError('Введите ваше имя');
    }

    if (name.match(/\d/)) {
      return actions.showError('Имя не должно содержать цифры!');
    }

    for (let i in this.data.photos) {
      const photo = this.data.photos[i];
      if (photo.isUploading) {
        actions.showError('Дождитесь загрузки фото');
        return;
      }
    }

    const photos = this.data.photos;
    const deletedPhotos = this.data.deletedPhotos;

    if (!Object.keys(photos).length) {
      return actions.showError('Загрузите хотя бы одну фотографию!');
    }

    let savePhotos = [];
    let deletePhotos = [];
    for (let i in deletedPhotos) {
      if (!photos.hasOwnProperty(i) || photos[i].id !== deletedPhotos[i]) {
        deletePhotos.push(deletedPhotos[i]);
      }
    }

    for (let i in photos) {
      const photo = photos[i];
      if (photo.hash) {
        savePhotos.push([parseInt(i, 10) + 1, photo.hash].join(','));
      }
    }

    const params = {
      name,
      gender,
      ...birthdays,
      country_id: country.id || 0,
      city_id: city.id || 0,
      delete_photos: deletePhotos.join(','),
      save_photos: savePhotos.join(';'),
      purpose,
      job,
      education,
      about
    };

    actions.loaderShow();
    api.method(api.methods.edit, params).then((user) => {
      actions.setUser(user);
      actions.loaderSuccess();
      cardsActions.clear();
      window.history.back();
    }).catch(() => {
      actions.loaderHide();
      actions.showError();
    });
  };
}
