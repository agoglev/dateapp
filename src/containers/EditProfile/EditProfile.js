import React from 'react';
import { Panel, PanelHeader, FormLayout, Input, Select, SelectMimicry, FixedLayout, Button, Textarea, Checkbox } from '@vkontakte/vkui';
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
    return (
      <div>
        <Header
          left={<UICloseButton />}
        >
          Редактирование
        </Header>
        <FormLayout style={{paddingBottom: 77}}>
          <div style={{padding: '0 6px'}} top="Фотографии" bottom="Загрузите свои настоящие фотографии">
            <div className="profile_edit_photos">
              {this._renderPhotos()}
            </div>
          </div>
          <Input
            top="Имя"
            value={this.data.name}
            onChange={(e) => this.setData('name', e.target.value)}
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
          />
          <Input
            top="Образование"
            value={this.data.education}
            onChange={(e) => this.setData('education', e.target.value)}
          />
          <Textarea
            top="О себе"
            value={this.data.about}
            onChange={(e) => this.setData('about', e.target.value)}
          />
          <FixedLayout vertical="bottom" className="Join__footer_btn_wrap">
            <Button size="xl" level="1" onClick={this._saveButtonDidPress} style={{margin: 16}}>Сохранить</Button>
          </FixedLayout>
        </FormLayout>
      </div>
    )
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
      actions.showError('Произошла ошибка!');
    });
  };
}
