import React from 'react';
import { Panel, PanelHeader, FormLayout, Input, Select, SelectMimicry, FixedLayout, Button, Textarea } from '@vkontakte/vkui';
import * as actions from '../../actions/index';
import * as utils from '../../utils/index';
import * as pages from "../../constants/pages";
import * as cardsActions from "../../actions/cards";
import UiBirthDay from '../../components/UI/UiBirthDay';
import BaseComponent from '../../BaseComponent';
import * as loadImage from "blueimp-load-image";
import * as api from '../../services/api';
import UICloseButton from '../../components/UI/UICloseButton';

export default class EditProfile extends BaseComponent {
  componentDidMount() {
    if (this.data.vkPhoto) {
      this._vkPhotoDidSelect(this.data.vkPhoto);
    }
  }

  render() {
    return (
      <Panel id={this.props.id}>
        <PanelHeader
          left={<UICloseButton />}
        >
          Редактирование
        </PanelHeader>
        <FormLayout style={{paddingBottom: 77}}>
          <div style={{padding: '0 6px'}}>
            <div className="profile_edit_photos" top="Фотографии" bottom="Загрузите свои настоящие фотографии">
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
          <FixedLayout vertical="bottom" style={{backgroundColor: '#ebedf0', position: 'relative', zIndex: 1000}}>
            <Button size="xl" level="1" onClick={this._saveButtonDidPress} style={{margin: 16}}>Сохранить</Button>
          </FixedLayout>
        </FormLayout>
      </Panel>
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

  _renderPhotos() {
    return new Array(6).fill(1, 0, 6).map((_, i) => {
      const photo = this.data.photos[i];

      const classNames = utils.classNames({
        profile_edit_photo: true,
        uploaded: photo && !photo.isUploading,
        uploading: photo && photo.isUploading
      });
      const photoUrl = photo ? photo.url : '';

      return (
        <div className={classNames} key={i} onClick={(e) => {
          if (e.target.className !== 'profile_edit_photo_delete') {
            this._selectPhotoSheet(i)
          }
        }}>
          <div className="profile_edit_photo_cont">
            <div className="profile_edit_photo_image" style={{backgroundImage: `url(${photoUrl})`}} />
            <div className="profile_edit_photo_index">{i + 1}</div>
            <div className="profile_edit_photo_delete" onClick={() => this.removePhoto(i)} />
            <div className="profile_edit_photo_loader" />
          </div>
        </div>
      );
    });
  }

  photoDidSelect(index, file) {
    if (!file) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    if (file.type.substr(0, 5) !== 'image') {
      return;
    }

    loadImage.parseMetaData(file, (data) => {
      let orientation = 0;
      if (data.exif) {
        orientation = data.exif.get('Orientation');
      }
      const loadingImage = loadImage(
        file,
        (canvas) => {
          const base64data = canvas.toDataURL('image/jpeg');
          const blobBin = atob(base64data.split(',')[1]);
          let array = [];
          for(let i = 0; i < blobBin.length; i++) {
            array.push(blobBin.charCodeAt(i));
          }
          const newFile = new Blob([new Uint8Array(array)], {type: 'image/png'});

          let photos = this.data.photos;
          photos[index] = {
            isUploading: true,
            isFailed: false,
            url: base64data
          };
          this.setData('photos', photos);

          actions.uploadPhoto(newFile).then((photoHash) => {
            let photos = this.data.photos;
            if (photos[index]) {
              photos[index].isUploading = false;
              photos[index].hash = photoHash;
              this.setData('photos', photos);
            }
          }).catch(() => {
            this.removePhoto(index);
            actions.showError('Неудалось загрузить фото');
          })
        }, {
          canvas: true,
          orientation: orientation,
          maxWidth: 800
        }
      );
    });
  }

  removePhoto(index) {
    let photos = this.data.photos;
    if (!photos[index]) {
      return;
    }

    if (photos[index].id) {
      let deletedPhotos = this.data.deletedPhotos;
      deletedPhotos[index] = photos[index].id;
      this.setData('deletedPhotos', deletedPhotos);
    }

    delete photos[index];
    this.setData('photos', photos);
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

  _selectPhotoSheet = (i) => {
    actions.showActionSheet([
      {
        title: 'Из профиля ВК',
        onClick: () => this._selectVkPhoto(i)
      },
      {
        title: <span>Из галереи <input className="profile_edit_photo_input" type="file" accept="image/*" onChange={(e) => {
          actions.setPopout();
          this.photoDidSelect(i, e.target.files[0]);
        }} /></span>,
        autoclose: false
      }
    ], 'Загрузка фотографии');
  };

  _selectVkPhoto(i) {
    actions.loaderShow();
    api.vk('photos.get', {
      album_id: 'profile',
      count: 300,
      photo_sizes: 1,
      rev: 1
    })
      .then((resp) => {
        actions.loaderHide();

        let photos = [];
        for (let i = 0; i < resp.items.length; i++) {
          const item = resp.items[i];
          let src = false;
          let lastSize = 0;
          for (let j = 0; j < item.sizes.length; j++) {
            const size = item.sizes[j];
            if (size.width > lastSize) {
              src = size.url;
              lastSize = size.width;
            }
            if (lastSize >= 600) {
              break;
            }
            if (['x', 'y'].indexOf(size.type) > -1) {
              src = size.url;
              break;
            }
          }
          if (!src) {
            continue;
          }
          photos.push({src});
        }

        if (!photos.length) {
          return actions.showAlert('Нет фотографий', 'У вас нет ни одной фотографии профиля ВКонтакте');
        }

        actions.go(pages.VK_PHOTOS, {
          photos,
          page: pages.EDIT_PROFILE,
          index: i
        });
      })
      .catch((err) => {
        actions.loaderHide();
        actions.showError('Не удалось получить фотографии: ' + err);
      })
  }

  _vkPhotoDidSelect(photo) {
    this.setData('vkPhoto', void 0);
    fetch(photo.src)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'file.png', blob);
        this.photoDidSelect(photo.index, file);
      }).catch(() => actions.showError('Произошла ошибка'))
  }
}
