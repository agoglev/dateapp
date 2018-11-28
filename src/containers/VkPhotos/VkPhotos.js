import './VkPhotos.css';

import React from 'react';
import { Panel, PanelHeader, HeaderButton, Group } from '@vkontakte/vkui';
import BaseComponent from '../../BaseComponent';
import * as actions from '../../actions';
import Header from '../../components/proxy/Header';

export default class VkPhotos extends BaseComponent {
  render() {
    if (window.isDesktop) {
      return (
        <div>{this._renderContent()}</div>
      )
    }

    return (
      <Panel id={this.props.id}>{this._renderContent()}</Panel>
    )
  }

  _renderContent() {
    return (
      <div>
        <Header
          left={<HeaderButton onClick={() => window.history.back()}>
            Закрыть
          </HeaderButton>}
        >
          Фотографии
        </Header>
        <Group>
          <div className="profile_edit_vk_albums_items">
            {this._renderPhotos()}
          </div>
        </Group>
      </div>
    )
  }

  _renderPhotos() {
    const photos = this.data.photos || [];
    return photos.map((photo) => {
      return (
        <div className="profile_edit_vk_photos_item" onClick={() => this._photoDidSelect(photo.src)}>
          <div className="profile_edit_vk_photos_item_cont" style={{backgroundImage: `url(${photo.src})`}} />
        </div>
      )
    });
  }

  _photoDidSelect(src) {
    window.history.back();
    actions.setData('vkPhoto', {
      src,
      index: this.data.index
    }, this.data.page);
  }
}
