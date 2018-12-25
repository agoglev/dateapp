import './Join.css'

import React from 'react';
import BaseComponent from '../../BaseComponent';
import { Div, Group, Button } from '@vkontakte/vkui';
import * as actions from '../../actions';
import * as pages from '../../constants/pages';
import * as utils from '../../utils';
import Header from '../../components/proxy/Header';
import * as accountActions from "../../actions/account";
import * as api from '../../services/api';
import * as loadImage from "blueimp-load-image";

export default class JoinIntro extends BaseComponent {
  componentDidMount() {
    utils.statReachGoal('join_intro');
  }

  render() {
    return (
      <div>
        <Header>
          Знакомства
        </Header>
        <Group>
          <Div>
            <div className="Join__intro-art-wrap">
              <div className="Join__intro-art" />
            </div>
            <div className="Join__intro">
              <div className="Join__intro-title">Знакомиться просто</div>
              <div className="Join__intro-caption">Поможем познакомиться с новыми интересными людьми, начать общение, а может, и нечто большее.</div>
            </div>
          </Div>
          <Div>
            <Button size="xl" level="1" onClick={this._buttonDidPress}>Создать анкету</Button>
          </Div>
        </Group>
      </div>
    )
  }

  _buttonDidPress = () => {
    if (window.isDG) {
      actions.loaderShow();
      api.vk('users.get', {
        fields: 'sex,bdate,country,city,photo_max'
      }).then((users) => {
        const user = users[0];
        accountActions.setupVkInfo(user);
        if (this._isCanAutoReg(user)) {
          this._autoReg(user);
        } else {
          actions.loaderHide();
          setTimeout(actions.openJoinStep1, 100);
        }
      }).catch((err) => actions.showError(err.message));
    } else {
      actions.openJoinStep1();
    }
  };

  _isCanAutoReg(user) {
    return (
      user.first_name &&
      user.bdate &&
      user.sex &&
      user.country &&
      user.city &&
      user.photo_max &&
      user.photo_max.indexOf('camera_') === -1 &&
      user.photo_max.indexOf('/images/') === -1
    );
  }

  _autoReg(user) {
    this._uploadPhoto(user.photo_max).then((photoHash) => {
      const bdate = (user.bdate || '').split('.').map((item) => parseInt(item, 10));
      const day = bdate[0] || 0;
      const month = Math.max(0, (bdate[1] - 1)) || 0;
      const year = bdate[2] || 0;

      accountActions.fillJoinInfo({
        name: user.first_name,
        gender: user.sex,
        day,
        month,
        year,
        country: user.country ? user.country.id : 0,
        city: user.city ? user.city.id : 0
      });
      accountActions.createAccount([photoHash]);
    }).catch((err) => actions.showError(err.message));
  }

  _uploadPhoto(src) {
    return new Promise((resolve, reject) => {
      fetch(src)
        .then(res => res.blob())
        .then(file => {
          file.lastModifiedDate = new Date();

          loadImage.parseMetaData(file, (data) => {
            let orientation = 0;
            if (data.exif) {
              orientation = data.exif.get('Orientation');
            }
            loadImage(
              file,
              (canvas) => {
                const base64data = canvas.toDataURL('image/jpeg');
                const blobBin = atob(base64data.split(',')[1]);
                let array = [];
                for(let i = 0; i < blobBin.length; i++) {
                  array.push(blobBin.charCodeAt(i));
                }
                const newFile = new Blob([new Uint8Array(array)], {type: 'image/png'});
                actions.uploadPhoto(newFile).then((photoHash) => resolve(photoHash)).catch(reject);
              }, {
                canvas: true,
                orientation: orientation,
                maxWidth: 800
              }
            );
          });
        }).catch(reject);
    });
  }
}
