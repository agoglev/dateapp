import './Join.css';

import React from 'react';
import * as actions from '../../actions';
import * as accountActions from '../../actions/account';
import * as pages from '../../constants/pages';
import * as utils from '../../utils';
import { Panel, PanelHeader, FormLayout, Button } from '@vkontakte/vkui';
import UIBackButton from '../../components/UI/UIBackButton';
import UploadPhotoComponent from '../../components/UploadPhotoComponent/UploadPhotoComponent';

export default class JoinStep3 extends UploadPhotoComponent {
  componentDidMount() {
    super.componentDidMount();
    utils.statReachGoal('join_step3');
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
}
