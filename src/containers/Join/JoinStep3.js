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
        setTimeout(() => actions.go(pages.MAIN), 500);
        utils.statReachGoal('register');
      })
      .catch(() => {
        actions.showError('Произошла ошибка');
      });
  };
}
