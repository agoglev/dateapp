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
import Icon24Message from '@vkontakte/icons/dist/24/message';
import Icon24Users from '@vkontakte/icons/dist/24/users';

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
        {!window.isDesktop && !window.isOK && <div>
          <Button level="3" component="a"
                  href="https://vk.me/dateapp" before={<Icon24Message />} target="_blank">Сообщить о проблеме</Button>
          <Button level="3" component="a"
                  href="https://vk.com/dateapp" before={<Icon24Users />} target="_blank">Сообщество</Button>
        </div>}
      </div>
    )
  }

  _buttonDidPress = () => {
    if (window.isOK) {
      actions.loaderShow();
      window.FAPI.Client.call({
        fields: 'first_name,birthday,pic_max,gender',
        method: 'users.getCurrentUser',
        location_search: window.queryStr
      }, (method, result, data) => {
        actions.loaderHide();

        if (!result) {
          return actions.openJoinStep1();
        }

        let bdate = '';
        if (result.birthdaySet) {
          bdate = result.birthday.split('-').map((item) => parseInt(item, 10)).reverse().join('.');
        }

        accountActions.setupVkInfo({
          sex: result.gender === 'male' ? 2 : 1,
          first_name: result.first_name,
          bdate,
          pic_max: result.pic_max
        });

        actions.openJoinStep1();
      });
    } else if (window.isDG) {
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
          setTimeout(() => {
            actions.openJoinStep1(user);
          }, 100);
        }
      }).catch((err) => actions.showError(err.message));
    } else {
      const user = this.props.state.vkUserInfo;
      if (user && this._isCanAutoReg(user)) {
        actions.loaderShow();
        this._autoReg(user);
      } else {
        actions.openJoinStep1(user);
      }
    }
  };

  _isCanAutoReg(user) {
    let photo = user.photo_max_orig || user.photo_max;
    if (photo.indexOf('camera_') > -1 || photo.indexOf('/images/') > -1) {
      photo = false;
    }

    return (
      user.first_name &&
      user.bdate &&
      user.sex &&
      user.country &&
      user.city &&
      photo
    );
  }

  _autoReg(user) {
    this._uploadPhoto(user.photo_max_orig || user.photo_max).then((photoHash) => {
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
        country: user.country ? user.country : 0,
        countryId: user.country ? user.country.id : 0,
        city: user.city ? user.city : 0,
        cityId: user.city ? user.city.id : 0
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
