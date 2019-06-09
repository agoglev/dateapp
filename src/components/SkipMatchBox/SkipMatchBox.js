import './SkipMatchBox.css';
import React, { PureComponent } from 'react';
import * as actions from '../../actions';
import { Button } from '@vkontakte/vkui';
import * as payments from "../../actions/payments";

export default class SkipMatchBox extends PureComponent {
  render() {
    const user = this.props.user;
    return (
      <div className="permissions_modal_wrap skip_match_box" ref="wrap">
        <div className="permissions_modal">
          <div className="permissions_close" onClick={() => actions.setPopout()} />
          <div className="permissions_modal_icon skip_match_photo" style={{backgroundImage: `url(${user.big_photo})`}} />
          <div className="permissions_modal_title">{user.name}</div>
          <div className="permissions_caption">Вам нужен Знакомства «Премиум», чтобы написать сообщение, не дожидаясь взаимного лайка!</div>
          <div>
            <Button size="xl" level="1" style={{marginTop: 24}} onClick={() => {
              actions.setPopout();
              setTimeout(() => payments.showSubscriptionRequest('skip_match'), 300);
            }}>Написать сообщение</Button>
          </div>
        </div>
      </div>
    )
  }
}
