import './SubscriptionBox.css';
import React, { PureComponent } from 'react';
import Icon24Cancel from '@vkontakte/icons/dist/24/cancel';
import * as actions from '../../actions';
import { Button, PopoutWrapper } from '@vkontakte/vkui';
import * as paymentsActions from '../../actions/payments';
import * as utils from "../../utils";
import Slider from 'react-slick';

export default class SubscriptionBox extends PureComponent {
  componentDidMount() {
    this.autoPlayTimer = setTimeout(() => this.refs['slider'].slickPlay(), 7000);
  }

  componentWillUnmount() {
    clearTimeout(this.autoPlayTimer);
  }

  render() {
    return (
      <PopoutWrapper v="center" h="center">
        <div className="SubscriptionBox">
          <div className="SubscriptionBox__cont-wrap">
            <div className="SubscriptionBox__close" onClick={() => actions.setPopout()}><Icon24Cancel /></div>
            {this._renderItems()}
            <div className="SubscriptionBox__cont">
              <div className="SubscriptionBox__title">Знакомства «Премиум»</div>
              <div className="SubscriptionBox__caption">Получите набор опций, которые помогут знакомиться успешнее</div>
              {this._renderBuyButtons()}
              {this._freeButton()}
            </div>
          </div>
        </div>
      </PopoutWrapper>
    )
  }

  _freeButton() {
    if (!paymentsActions.hasPromo() || true) {
      return null;
    }

    return (
      <Button
        size="l"
        level="tertiary"
        style={{marginTop: 12}}
        onClick={() => {
          actions.showAlert('Бесплатный «Премиум»', <span>Опубликуйте историю и получите «Премиум» <b>на сутки</b> бесплатно!</span>, 'Опубликовать')
            .then(() => actions.publishStory())
            .catch(() => console.log('canceled'));
        }}
      >Получить бесплатно</Button>
    )
  }

  _renderBuyButtons() {
    let prices;
    if (window.isDG) {
      prices = {
        day: utils.gram(paymentsActions.Prices.premiumDay.votes * 2, ['голос', 'голоса', 'голосов']),
        daySale: utils.gram(paymentsActions.Prices.premiumDay.votes, ['голос', 'голоса', 'голосов']),
        week: utils.gram(paymentsActions.Prices.premiumWeek.votes * 2, ['голос', 'голоса', 'голосов']),
        weekSale: utils.gram(paymentsActions.Prices.premiumWeek.votes, ['голос', 'голоса', 'голосов']),
        month: utils.gram(paymentsActions.Prices.premiumMonth.votes * 2, ['голос', 'голоса', 'голосов']),
        monthSale: utils.gram(paymentsActions.Prices.premiumMonth.votes, ['голос', 'голоса', 'голосов'])
      };
    } else {
      prices = {
        day: utils.gram(paymentsActions.Prices.premiumDay.rubles * 2 , ['рубль', 'рубля', 'рублей']),
        daySale: utils.gram(paymentsActions.Prices.premiumDay.rubles, ['рубль', 'рубля', 'рублей']),
        week: utils.gram(paymentsActions.Prices.premiumWeek.rubles * 2 , ['рубль', 'рубля', 'рублей']),
        weekSale: utils.gram(paymentsActions.Prices.premiumWeek.rubles, ['рубль', 'рубля', 'рублей']),
        month: utils.gram(paymentsActions.Prices.premiumMonth.rubles * 2, ['рубль', 'рубля', 'рублей']),
        monthSale: utils.gram(paymentsActions.Prices.premiumMonth.rubles, ['рубль', 'рубля', 'рублей']),
        year: utils.gram(paymentsActions.Prices.premiumYear.rubles * 2, ['рубль', 'рубля', 'рублей']),
        yearSale: utils.gram(paymentsActions.Prices.premiumYear.rubles, ['рубль', 'рубля', 'рублей'])
      };
    }

    if (window.isDG && window.isDesktop && false) {
      return (
        <div style={{marginTop: 26}}>
          <Button size="xl" onClick={() => this._rateDidPress('subscription')}>Попробовать бесплатно</Button>
          <div className="VKPay_info">3 дня бесплатно, дальше — {prices.monthSale} в месяц</div>
        </div>
      )
    }

    const vkPayInfo = window.isDG ? null : <div className="VKPay_info">Безопасный платеж через <div className="VKPay_icon" /></div>;

    return (
      <div className="SubscriptionBox__pay_buttons">
        <div className="SubscriptionBox__pay_button" onClick={() => this._rateDidPress('day')}>
          <div className="SubscriptionBox__pay_button__title">День</div>
          <div className="SubscriptionBox__pay_button__price">{prices.day}</div>
          <div className="SubscriptionBox__pay_button__price sale">{prices.daySale}</div>
          <div className="SubscriptionBox__pay_button__buy">Получить</div>
        </div>
        {/*<div className="SubscriptionBox__pay_button" onClick={() => this._rateDidPress('week')}>
          <div className="SubscriptionBox__pay_button__badge red">популярно</div>
          <div className="SubscriptionBox__pay_button__title">Неделя</div>
          <div className="SubscriptionBox__pay_button__price">{prices.week}</div>
          <div className="SubscriptionBox__pay_button__price sale">{prices.weekSale}</div>
          <div className="SubscriptionBox__pay_button__buy">Получить</div>
        </div>*/}
        <div className="SubscriptionBox__pay_button" onClick={() => this._rateDidPress('month')}>
          <div className="SubscriptionBox__pay_button__badge red">популярно</div>
          <div className="SubscriptionBox__pay_button__title">Месяц</div>
          <div className="SubscriptionBox__pay_button__price">{prices.month}</div>
          <div className="SubscriptionBox__pay_button__price sale">{prices.monthSale}</div>
          <div className="SubscriptionBox__pay_button__buy">Получить</div>
        </div>
        <div className="SubscriptionBox__pay_button" onClick={() => this._rateDidPress('year')}>
          <div className="SubscriptionBox__pay_button__badge green">выгодно</div>
          <div className="SubscriptionBox__pay_button__title">Год</div>
          <div className="SubscriptionBox__pay_button__price">{prices.year}</div>
          <div className="SubscriptionBox__pay_button__price sale">{prices.yearSale}</div>
          <div className="SubscriptionBox__pay_button__buy">Получить</div>
        </div>
      </div>
    )
  }

  /*
              <div className="SubscriptionBox__pay_button" onClick={() => this._rateDidPress('weak')}>
              <div className="SubscriptionBox__pay_button__badge">популярно</div>
              <div className="SubscriptionBox__pay_button__title">Неделя</div>
              <div className="SubscriptionBox__pay_button__price">{prices.weak}</div>
              <div className="SubscriptionBox__pay_button__buy">Получить</div>
            </div>
   */

  _rateDidPress = (rate) => {
    const target = this.props.target;
    actions.setPopout();
    setTimeout(() => paymentsActions.buyPremium(`premium_${rate}`, target), 100);
  };

  _renderItems() {
    const opts = this.props.opts || {};
    const likesLabel = opts.likesCount ? `Вы понравились ${utils.gram(opts.likesCount, ['человеку', 'людям', 'людям'])}. Узнайте, кто они!` : 'Узнайте, кому Вы понравились';

    const items = [
      {type: 'likes', label: likesLabel},
      {type: 'skip_match', label: 'Пишите сообщения без взаимной симпатии'},
      {type: 'messages', label: 'Пусть ваши сообщения читают в первую очередь'},
      {type: 'cancel_action', label: 'Отмените свое «нет» в «Карточках»'},
      {type: 'fav', label: 'Узнайте, кто добавил вас в "Избранные"'},
      {type: 'invisible', label: 'Станьте невидимкой'},
    ];

    let initialSlide = 0;
    const slides = items.map((slide, i) => {
      const className = utils.classNames({
        SubscriptionBox__slide: true,
        [slide.type]: true
      });

      if (this.props.target === slide.type) {
        initialSlide = i;
      }

      return (
        <div className={className} key={slide.type}>
          <div className="SubscriptionBox__slide__icon" />
          <div className="SubscriptionBox__slide__label">{slide.label}</div>
        </div>
      )
    });


    const settings = {
      dots: true,
      infinite: true,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1,
      autoplay: false,
      autoplaySpeed: 3000,
      initialSlide,
      ref: 'slider',
      onSwipe: () => {
        clearTimeout(this.autoPlayTimer);
        this.refs['slider'].slickPause();
        this.autoPlayTimer = setTimeout(() => this.refs['slider'].slickPlay(), 7000);
      }
    };

    return (
      <Slider className="SubscriptionBox__slider" {...settings}>
        {slides}
      </Slider>
    )
  }
}
