import './Join.css';

import React from 'react';
import * as actions from '../../actions';
import * as accountActions from '../../actions/account';
import * as pages from '../../constants/pages';
import * as utils from '../../utils';
import { Panel, PanelHeader, FormLayout, Button } from '@vkontakte/vkui';
import UIBackButton from '../../components/UI/UIBackButton';
import UploadPhotoComponent from '../../components/UploadPhotoComponent/UploadPhotoComponent';
import Header from '../../components/proxy/Header';

export default class JoinStep3 extends UploadPhotoComponent {
  componentDidMount() {
    super.componentDidMount();
    utils.statReachGoal('join_step3');
  }

  render() {
    if (window.isDesktop) {
      return <div>{this._renderContent()}</div>;
    }

    return <Panel id={this.props.id}>{this._renderContent()}</Panel>;
  }

  _renderContent() {
    return (
      <div>
        <Header
          left={<UIBackButton />}
        >
          Фотографии
        </Header>
        <FormLayout>
          <div style={{padding: '0 6px'}} bottom="Загрузите свои настоящие фотографии">
            <div className="profile_edit_photos">
              {this._renderPhotos()}
            </div>
          </div>
          <Button size="xl" level="1" onClick={this.continueButtonDidPress}>Готово</Button>
        </FormLayout>
      </div>
    )
  }

  continueButtonDidPress = () => {
    let photos = [];
    for (let i = 0; i < 6; i++) {
      const photo = this.data.photos[i];
      if (!photo) {
        continue;
      }

      if (photo.needUpload) {
        return this._uploadMainPhoto(0, photo);
      }

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
        setTimeout(() => actions.go(pages.MAIN), 500);
        utils.statReachGoal('register');
      })
      .catch(() => {
        actions.showError('Произошла ошибка');
      });
  };

  _uploadMainPhoto(index, photo) {
    const photosPreset = this.data.photos;
    delete photosPreset[index].needUpload;
    photosPreset[index].isUploading = true;
    this.setData({photos: photosPreset});

    actions.loaderShow();

    fetch(photo.url)
      .then(res => res.blob())
      .then(blob => {
        blob.lastModifiedDate = new Date();
        this.photoDidSelect(index, blob).then(() => {
          const photos = this.data.photos;
          photos[index].isUploading = false;
          this.setData({photos});

          setTimeout(() => {
            actions.loaderHide();
            this.continueButtonDidPress();
          }, 100);
        }).catch(() => {
          const photos = this.data.photos;
          photos[index].needUpload = true;
          photos[index].isUploading = false;
          this.setData({photos});
          actions.showError('Неудалось загрузить фото');
        });
      }).catch((err) => {
      actions.showError('Неудалось скачать фото');
      const photos = this.data.photos;
      photos[index].isUploading = false;
      photos[index].needUpload = true;
      this.setData({photos});
    });
  }
}
