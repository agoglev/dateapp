import './Join.css';

import React from 'react';
import BaseComponent from '../../BaseComponent';
import * as actions from '../../actions';
import * as accountActions from '../../actions/account';
import * as pages from '../../constants/pages';
import * as utils from '../../utils';
import { Panel, PanelHeader, FormLayout, Button } from '@vkontakte/vkui';
import * as loadImage from 'blueimp-load-image';
import * as api from '../../services/api';
import UIBackButton from '../../components/UI/UIBackButton';

export default class JoinStep3 extends BaseComponent {
  componentDidMount() {
    utils.statReachGoal('join_step3');

    if (this.data.vkPhoto) {
      this._vkPhotoDidSelect(this.data.vkPhoto);
    }
  }

  render() {
    return (
      <Panel id={this.props.id}>
        <PanelHeader
          left={<UIBackButton />}
        >
          Фотографии
        </PanelHeader>
        <FormLayout>
          <div style={{padding: '0 6px'}}>
            <div className="profile_edit_photos" bottom="Загрузите свои настоящие фотографии">
              {this._renderPhotos()}
            </div>
          </div>
          <Button size="xl" level="1" onClick={this.continueButtonDidPress}>Готово</Button>
        </FormLayout>
      </Panel>
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

  continueButtonDidPress = () => {
    let photos = [];
    for (let i in this.data.photos) {
      const photo = this.data.photos[i];

      if (photo.isUploading) {
        actions.showError('Дождитесь загрузки фото');
        return;
      }

      photos.push(photo.hash);
    }

    if (photos.length === 0) {
      return actions.showError('Загрузите хотя бы одну фотографию');
    }

    accountActions.createAccount(photos)
      .then(() => {
        actions.go(pages.MAIN);
        utils.statReachGoal('register');
      })
      .catch(() => {
        actions.showError('Произошла ошибка');
      });
  };

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
    delete photos[index];
    this.setData('photos', photos);
  }

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
          page: pages.JOIN_STEP3,
          index: i
        });
      })
      .catch((err) => {
        actions.loaderHide();
        actions.showError('Не удалось получить фотографии');
      });
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
