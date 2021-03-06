import './Cards.css';

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Button, Spinner, HeaderButton } from '@vkontakte/vkui';
import * as cardsActions from '../../actions/cards';
import * as paymentsActions from '../../actions/payments';
import * as actions from '../../actions';
import * as utils from '../../utils';
import Icon24Replay from '@vkontakte/icons/dist/24/replay';
import Icon24Like from '@vkontakte/icons/dist/24/like_outline';
import Header from '../../components/proxy/Header';
import Tooltip from '../../components/Tooltip/Tooltip';
import {showNotification} from "../../actions/push";
import * as pages from '../../constants/pages';

const Purpose = [
  'Найти новых друзей',
  'Общаться',
  'Пойти на свидание'
];

let skippedLikes = {};

export default class Cards extends Component {

  static shared = null;

  constructor(props) {
    super(props);

    this.state = {
      activePhotos: {},
      rotate: 0,
      isMoving: false,
      likeButtonDiff: 0,
      dislikeButtonDiff: 0,
      isLoading: false,
      isFailed: false,
      swipeTip: false,
      isLikeSkipped: false
    };

    this.likesCount = 0;

    Cards.shared = this;
    this.adsShown = props.state.tabBarAdsShown;
  }

  componentWillMount() {
    this._load();
  }

  componentDidMount() {
    this._updateHeight();
    setTimeout(this._updateHeight, 200);

    const node = ReactDOM.findDOMNode(this.refs['items']);
    node.addEventListener('touchstart', this._touchDidStart);
    node.addEventListener('mousedown', this._touchDidStart);
    node.addEventListener('touchmove', this._touchDidMove);
    node.addEventListener('mousemove', this._touchDidMove);
    node.addEventListener('touchend', this._touchDidEnd);
    node.addEventListener('mouseup', this._touchDidEnd);

    document.addEventListener('touchmove', this._disableScroll);

    utils.statReachGoal('page_cards');
  }

  componentWillUnmount() {
    const node = ReactDOM.findDOMNode(this.refs['items']);
    node.removeEventListener('touchstart', this._touchDidStart);
    node.removeEventListener('mousedown', this._touchDidStart);
    node.removeEventListener('touchmove', this._touchDidMove);
    node.removeEventListener('mousemove', this._touchDidMove);
    node.removeEventListener('touchend', this._touchDidEnd);
    node.removeEventListener('mouseup', this._touchDidEnd);

    document.removeEventListener('touchmove', this._disableScroll);

    if (this.swipeTipTimer) {
      clearTimeout(this.swipeTipTimer);
      delete this.swipeTipTimer;
    }
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextProps.state.tabBarAdsShown !== this.adsShown) {
      this.adsShown = nextProps.state.tabBarAdsShown;
      setTimeout(this._updateHeight, 200);
    }
  }

  render() {
    const state = this.props.state;

    let isSystemCard = state.cards.length > 0 && (state.cards[0].system && !state.cards[0].is_ad);
    const className = utils.classNames({
      Cards: true,
      is_moving: this.state.isMoving,
      empty: !this.props.state.cards.length && !this.state.isLoading && !this.state.isFailed,
      hideControls: !this.props.state.cards.length || this.state.isLoading && state.cards.length === 0 || this.state.isFailed || isSystemCard
    });

    return (
      <div>
        <Header
          left={this._renderCancelAction()}
        >
          Карточки
        </Header>
        <div className={className}>
          <div
            className="Cards__big_button like"
            onClick={this._likeButtonDidPress}
            style={{transform: `translateX(-${this.state.likeButtonDiff}px) scale(${this.state.likeButtonScale})`}}
          />
          <div
            className="Cards__big_button dislike"
            onClick={this._dislikeButtonDidPress}
            style={{transform: `translateX(${this.state.dislikeButtonDiff}px) scale(${this.state.dislikeButtonScale})`}}
          />
          {this._renderEmpty()}
          <div className="Cards__items" ref="items">
            {this._renderCards()}
          </div>
        </div>
      </div>
    )
  }

  _renderEmpty() {
    if (cardsActions.getCurrentList() === 'community') {
      return (
        <div className="cards_empty im_history_empty">
          <div className="im_history_empty_img" />
          <div className="im_history_empty_title">Карточки закончились</div>
          <div className="im_history_empty_text">Анкет из сообщества больше нет, попробуйте зайти позже или знакомьтесь с людьми из всего приложения.</div>
          <div className="im_history_empty_extra">
            <div><Button size="l" onClick={this._switchListToAll}>Показать всех</Button></div>
          </div>
        </div>
      )
    }

    return (
      <div className="cards_empty im_history_empty">
        <div className="im_history_empty_img" />
        <div className="im_history_empty_title">Карточки закончились</div>
        <div className="im_history_empty_text">Заходите попозже — наверняка кто-то еще захочет познакомиться</div>
        <div className="im_history_empty_extra">
          <div><Button size="l" onClick={this._clearHiddenCard}>Показать снова</Button></div>
          <div style={{marginTop: '10px'}}><Button stretched size="l" level="secondary" onClick={() => actions.openFilters()}>Фильтры</Button></div>
        </div>
      </div>
    )
  }

  _switchListToAll = () => {
    cardsActions.setCurrentList('all');
    this._load();
  };

  _renderCancelAction() {
    if (this.props.state.dislikedCards.length === 0) {
      if (actions.getData(pages.ACTIVITY).likesCount > 0) {
        return (
          <HeaderButton key="cancel_action" onClick={() => {
            actions.openLikes();
            utils.statReachGoal('likes_open_modal');
          }}>
            <Icon24Like className="Cards__like_badge" />
          </HeaderButton>
        )
      }
      return null;
    }

    if (window.isDesktop) {
      return this._renderCancelActionCont();
    }

    return (
      <Tooltip
        offsetX={window.isDesktop ? -8 : 0}
        key="cancel_action"
        text="Упс! Вы упустили симпатию"
        isShown={!this.state.isLoading && !this.state.isFailed && this.state.isLikeSkipped}
        onClose={() => this.setState({isLikeSkipped: false})}
      >
        {this._renderCancelActionCont()}
      </Tooltip>
    )
  }

  _renderCancelActionCont() {
    return (
      <HeaderButton key="cancel_action" onClick={this._cancelAction}>
        <Icon24Replay />
      </HeaderButton>
    )
  }

  _renderCards() {
    const cards = this.props.state.cards;

    if (this.state.isLoading && !cards.length) {
      return <div className="Activity__loader"><Spinner/></div>;
    }

    if (this.state.isFailed) {
      return <div className="Activity__failed">
        <div className="Activity__failed_msg">Произошла ошибка ({this.state.isFailed})</div>
        <Button size="l" onClick={this._load}>Повторить</Button>
      </div>;
    }

    const now = Math.floor(new Date().getTime() / 1000);
    return cards.slice(0, 2).map((card, i) => {
      const isActive = i === 0;
      const className = utils.classNames({
        Cards__item: true,
        swipeTip: isActive && this.state.swipeTip,
        online: now - utils.convertTimezone(card.last_update) < 60 * 10
      });

      const rotate = isActive ? this.state.rotate : 0;
      const x = isActive ? this.state.diff + 'px' : 0;

      let style = {zIndex: 2 - i};
      if (isActive) {
        style.transform = `rotate(${rotate}deg) translateX(${x}) translateZ(0)`;
      } else {
        style.transform = `scale(0.92) translateZ(0)`;
      }

      if (card.is_ad) {
        style.backgroundImage = `url(${card.photo})`;
        return (
          <a
            className="Cards__item ads"
            key={`ad_${card.id}`}
            style={style}
            href={card.url}
            target="_blank"
          >
            <div className="Cards__ads__adv-info">Реклама</div>
          </a>
        )
      }

      if (card.system) {
        return (
          <div
            className="Cards__item system"
            key={card.type}
            style={style}
          >
            <div className="Cards__item--system-title">{card.title}</div>
            <div className="Cards__item--system-caption">{card.caption}</div>
            <div className="Cards__item--system-extra"><Button size="l" onClick={this._likeButtonDidPress}>Понятно</Button></div>
          </div>
        )
      }

      let nameComponents = [card.name];
      if (card.age_ts) {
        nameComponents.push(utils.getUsrAge(card.age_ts));
      }

      let captionVariants = [];

      let captionComponents = [];
      if (card.education) {
        captionComponents.push(<div key="education" className="Cards__item__caption_row education">{card.education}</div>);
      }
      if (card.job) {
        captionComponents.push(<div key="job" className="Cards__item__caption_row job">{card.job}</div>);
      }

      if (captionComponents.length > 0) {
        captionVariants.push(captionComponents);
      }

      const purpose = parseInt(card.purpose, 10);
      if (purpose > 0) {
        captionVariants.push(`Хочу ${Purpose[purpose - 1].toLowerCase()}`);
      }

      const photosActiveIndex = this.state.activePhotos[card.id] || 0;
      let captionIndex = captionVariants.length > 1 && photosActiveIndex > 0 ? 1 : 0;

      return (
        <div
          className={className}
          key={card.id}
          style={style}
        >
          {this._renderCardPhotos(card.id, card.photos)}
          <div className="Cards__item--footer">
            <div className="Cards__item--footer-info">
              <div className="Cards__item--footer-name">{nameComponents.join(', ')} {card.vip && utils.isPaymentsEnabled() && <div className="Cards__item__vip">VIP</div>}</div>
              <div className="Cards__item--footer-caption">{captionVariants[captionIndex]}</div>
            </div>
            <div className="Cards__item--footer-info-ic" />
          </div>
        </div>
      )
    });
  }

  _renderCardPhotos(userId, photos) {
    const activeIndex = this.state.activePhotos[userId] || 0;
    const photosRes = photos.map((photo, i) => {
      const className = utils.classNames({
        Cards__photo: true,
        active: activeIndex === i,
      });
      return (
        <div
          key={i}
          className={className}
          style={{backgroundImage: `url(${photo.photo400})`}}
        />
      )
    });

    const linesRes = photos.length > 1 ? photos.map((photo, i) => {
      const className = utils.classNames({
        cards_item_photo_line: true,
        selected: activeIndex === i
      });
      return <div key={i} className={className}/>
    }) : [];

    return (
      <div>
        <div className="cards_item_photo_lines">
          {linesRes}
        </div>
        {photosRes}
      </div>
    )

  }

  // Gesture recognition

  _touchDidStart = (event) => {
    const card = this.props.state.cards[0];
    if (card && !card.is_ad) {
      utils.cancelEvent(event);
    }

    if (this.state.isAnimating || !this.props.state.cards.length) {
      return;
    }

    this.startX = event.touches ? event.touches[0].clientX : event.clientX;

    if (window.isDesktop) {
      return;
    }

    this.isPressed = true;

    this.setState({
      isMoving: true,
      isLikeSkipped: false
    });
    this.lastDiff = 0;
    this.cancelTap = false;
  };

  _touchDidMove = (event) => {
    utils.cancelEvent(event);

    if (this.state.isAnimating || !this.isPressed) {
      return;
    }

    if (this.swipeTipTimer) {
      clearTimeout(this.swipeTipTimer);
      delete this.swipeTipTimer;
    }

    if (!cardsActions.swipeTipShown) {
      cardsActions.resolveSwipeTip();
      this.setState({swipeTip: false});
    }

    const clientX = event.touches ? event.touches[0].clientX : event.clientX;

    const centerX = window.isDesktop ? (window.innerWidth - 240) / 2 : window.innerWidth / 2;
    const diff = clientX - this.startX;
    const rotate = diff * 0.05;

    const extraDiff = Math.max(0, (Math.abs(diff) - centerX));
    const likeButtonDiff = diff > 0 ? Math.max(0, Math.min(diff - extraDiff, centerX - 50)) : 0;
    const dislikeButtonDiff = diff < 0 ? Math.max(0, Math.min(Math.abs(diff) - extraDiff, centerX - 50)) : 0;

    const likeButtonScale = 1 + likeButtonDiff / centerX;
    const dislikeButtonScale = 1 + dislikeButtonDiff / centerX;


    this.setState({
      rotate,
      diff,
      likeButtonDiff,
      likeButtonScale,
      dislikeButtonDiff,
      dislikeButtonScale
    });
    this.lastDiff = diff;
    if (Math.abs(diff) > 10) {
      this.cancelTap = true;
    }
  };

  _touchDidEnd = (event, force = false) => {
    const card = this.props.state.cards[0];
    if (card && !card.is_ad) {
      utils.cancelEvent(event);
    }

    if (this.state.isAnimating || !this.props.state.cards.length) {
      return;
    }

    this.isPressed = false;

    const percent = this.lastDiff / window.innerWidth;
    if (Math.abs(percent) >= 0.3 && (!window.isDesktop || force)) {
      const isLike = percent > 0;
      const toX = window.innerWidth * 1.3 * (isLike ? 1 : -1);
      this.setState({
        rotate: toX * 0.05,
        diff: toX,
        isMoving: false,
        isAnimating: true
      });

      setTimeout(() => {
        this._setReason(isLike);
        this._resetMovingStyles();
      }, 200);
    } else {
      this._resetMovingStyles();

      if (!this.cancelTap) {
        this._handleTap(event);
      }
    }
  };

  _resetMovingStyles = () => {
    this.setState({
      rotate: 0,
      diff: 0,
      isAnimating: false,
      likeButtonDiff: 0,
      likeButtonScale: 1,
      dislikeButtonDiff: 0,
      dislikeButtonScale: 1,
    });
  };

  _handleTap(event) {
    const target = event.target;
    const card = this.props.state.cards[0];

    if (!target) {
      return;
    }

    if (card.is_ad) {
      cardsActions.markAdAsSeen(card.id, true);
      return;
    }

    if (target.classList.contains('Cards__item__vip')) {
      paymentsActions.showSubscriptionRequest();
    } else if (target.classList.contains('Cards__item--footer') || target.closest('.Cards__item--footer')) {
      actions.openProfile(this.props.state.cards[0], {
        fromCards: true,
        hideControls: cardsActions.cancelledCards[card.id] && !paymentsActions.hasPremium && utils.isPaymentsEnabled()
      });
    } else {
      const width = window.isDesktop ? window.innerWidth - 240 : window.innerWidth;
      const isNext = this.startX > width / 2;
      let newIndex = this.state.activePhotos[card.id] || 0;

      if (isNext) {
        newIndex++;
        if (newIndex >= card.photos.length) {
          newIndex = 0;
        }
      } else {
        newIndex--;
        if (newIndex < 0) {
          newIndex = card.photos.length - 1;
        }
      }

      const activePhotos = this.state.activePhotos;
      activePhotos[card.id] = newIndex;
      this.setState({
        activePhotos
      });
    }
  }

  _disableScroll = (event) => {
    utils.cancelEvent(event);
  };

  // Other

  _setReason(isLike) {
    let card = this.props.state.cards[0];
    if (!card) {
      return;
    }

    if (card.system) {
      cardsActions.resolveSystemCard();

      if (card.is_ad && isLike) {
        window.open(card.url);
      }

      return false;
    }

    if (cardsActions.cancelledCards[card.id] && isLike && !paymentsActions.hasPremium && utils.isPaymentsEnabled()) {
      setTimeout(() => paymentsActions.showSubscriptionRequest('cancel_action'), 300);
      return;
    }

    if (!isLike && !cardsActions.dislikeTipShown) {
      actions.showAlert('Вы пропустили анкету', 'Вам действительно не понравился этот человек?', 'Да').then(() => {
        cardsActions.resolveDisLikeTip();
        this._dislikeButtonDidPress();
      }).catch(() => {
        cardsActions.resolveLikeTip();
      });
      return;
    } else if (isLike && !cardsActions.likeTipShown) {
      actions.showAlert('Вы поставили лайк', 'Вам действительно нравится этот человек?', 'Да').then(() => {
        cardsActions.resolveLikeTip();
        this._likeButtonDidPress();
      }).catch(() => {
        cardsActions.resolveLikeTip();
      });
      return;
    }

    cardsActions.setReason(isLike).then(() => {
      if (isLike && !cardsActions.matchTipShown) {
        actions.showAlert('Лайк поставлен!', 'Дождитесь взаимного лайка, чтобы начать общаться', 'Ок', {skipCancelButton: true});
        cardsActions.resolveMatchTip();
      }

      if (!isLike && card.is_like && !skippedLikes[card.id]) {
        skippedLikes[card.id] = true;
        this.setState({isLikeSkipped: true});
      }

      if (!isLike) {
        cardsActions.cancelledCards[card.id] = true;
      }

    }).catch((card) => {
        this._restoreCard(card, isLike);
        actions.showError();
      });

    if (isLike) {
      this.likesCount++;

      if (this.likesCount >= 2) {
        cardsActions.requestNotificationsAccess();
      }

      utils.statReachGoal('card_like');

      window.cardsSwipeRightCount = (window.cardsSwipeRightCount || 0) + 1;
      if (window.cardsSwipeRightCount === 10 || window.cardsSwipeRightCount === 30) {
        showNotification('swipe_right', `Продолжайте, осталось ${50 - window.cardsSwipeRightCount} свайпов!`, '', {
          timeout: 5000
        });
      }
    } else {
      utils.statReachGoal('card_dislike');
    }
  }

  _restoreCard(card, isLike) {
    cardsActions.prependCard(card);
    const toX = window.innerWidth * 1.3 * (isLike ? 1 : -1);
    this.setState({
      rotate: toX * 0.05,
      diff: toX,
      isMoving: true,
      isAnimating: true
    });
    setTimeout(() => {
      this.setState({
        rotate: 0,
        diff: 0,
        isMoving: false,
        isAnimating: false
      });
    }, 10);
  }

  _load = () => {
    this.setState({isLoading: true, isFailed: false});
    cardsActions.loadCards().then(() => {
      this.setState({isLoading: false});

      if (!cardsActions.swipeTipShown) {
        this.swipeTipTimer = setTimeout(() => {
          this.setState({swipeTip: true});
        }, 4000);
      }
    }).catch((err) => {
      this.setState({isLoading: false, isFailed: err.message});
    });
  };

  _likeButtonDidPress = (e) => {
    this.lastDiff = window.innerWidth;
    this._touchDidEnd(e, true);
  };

  _dislikeButtonDidPress = (e) => {
    this.lastDiff = -window.innerWidth;
    this._touchDidEnd(e, true);
  };

  _updateHeight = () => {
    const items = this.refs['items'];
    const headerHeight = utils.getHeaderHeight();
    const footerHeight = utils.getTabBarHeight();
    let height = (window.innerHeight - headerHeight - footerHeight);
    if (window.isDesktop) {
      height = Math.min(height, 567);
    }

    if (items) {
      items.style.height = height + 'px';
    }
  };

  _cancelAction = () => {
    const card = cardsActions.getLastDislikedCard();
    if (card) {
      this._restoreCard(card, false);
      utils.statReachGoal('cancel_action');
    }
  };

  _clearHiddenCard = () => {
    actions.showAlert('Показать снова', 'Все карточки, которые вы уже видели будут показаны снова, вы действительно хотите увидеть их?', 'Да, показать').then(() => {
      actions.loaderShow();
      cardsActions.clearSeenCards()
        .then(() => {
          actions.loaderSuccess();
          this._resetMovingStyles();
        })
        .catch(() => actions.showError());
    });
  };
}
