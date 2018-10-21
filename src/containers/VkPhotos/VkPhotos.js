import './VkPhotos.css';

import React from 'react';
import { Panel, PanelHeader, HeaderButton, Group } from '@vkontakte/vkui';
import BaseComponent from '../../BaseComponent';
import * as actions from '../../actions';

export default class VkPhotos extends BaseComponent {
  render() {
    return (
      <Panel id={this.props.id}>
        <PanelHeader
          left={<HeaderButton onClick={() => window.history.back()}>
            Закрыть
          </HeaderButton>}
        >
          Фотографии
        </PanelHeader>
        <Group>
          <div className="profile_edit_vk_albums_items">
            {this._renderPhotos()}
          </div>
        </Group>
      </Panel>
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
