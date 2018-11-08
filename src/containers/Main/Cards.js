import './Cards.css';

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { PanelHeader, Button, Spinner, HeaderButton } from '@vkontakte/vkui';
import * as cardsActions from '../../actions/cards';
import * as actions from '../../actions';
import * as utils from '../../utils';
import * as pages from '../../constants/pages';
import Icon24Replay from '@vkontakte/icons/dist/24/replay';

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
      isFailed: false
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
    node.addEventListener('touchmove', this._touchDidMove);
    node.addEventListener('touchend', this._touchDidEnd);

    document.addEventListener('touchmove', this._disableScroll);

    utils.statReachGoal('page_cards');
  }

  componentWillUnmount() {
    const node = ReactDOM.findDOMNode(this.refs['items']);
    node.removeEventListener('touchstart', this._touchDidStart);
    node.removeEventListener('touchmove', this._touchDidMove);
    node.removeEventListener('touchend', this._touchDidEnd);

    document.removeEventListener('touchmove', this._disableScroll);
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextProps.state.tabBarAdsShown !== this.adsShown) {
      this.adsShown = nextProps.state.tabBarAdsShown;
      setTimeout(this._updateHeight, 200);
    }
  }

  render() {
    const state = this.props.state;

    let isSystemCard = state.cards.length > 0 && state.cards[0].system;
    const className = utils.classNames({
      Cards: true,
      is_moving: this.state.isMoving,
      empty: !this.props.state.cards.length && !this.state.isLoading && !this.state.isFailed,
      hideControls: !this.props.state.cards.length || this.state.isLoading && state.cards.length === 0 || this.state.isFailed || isSystemCard
    });

    return (
      <div>
        <PanelHeader
          left={this._renderCancelAction()}
        >
          Карточки
        </PanelHeader>
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
          <div className="cards_empty im_history_empty">
            <div className="im_history_empty_img" />
            <div className="im_history_empty_title">Карточки закончились</div>
            <div className="im_history_empty_text">Заходите попозже — наверняка кто-то еще захочет познакомиться</div>
            <div className="im_history_empty_extra"><Button size="l" onClick={this._clearHiddenCard}>Показать снова</Button></div>
          </div>
          <div className="Cards__items" ref="items">
            {this._renderCards()}
          </div>
        </div>
      </div>
    )
  }

  _renderCancelAction() {
    if (this.props.state.dislikedCards.length === 0) {
      return null;
    }

    return (
      <HeaderButton onClick={this._cancelAction}>
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
        <div className="Activity__failed_msg">Произошла ошибка</div>
        <Button size="l" onClick={this._load}>Повторить</Button>
      </div>;
    }

    return cards.slice(0, 2).map((card, i) => {
      const isActive = i === 0;
      const className = utils.classNames({
        Cards__item: true,
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
            <div className="Cards__ads__info">
              <div className="Cards__ads__title">{card.title}</div>
              <div className="Cards__ads__button">Открыть</div>
            </div>
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

      return (
        <div
          className={className}
          key={card.id}
          style={style}
        >
          {this._renderCardPhotos(card.id, card.photos)}
          <div className="Cards__item--footer">
            <div className="Cards__item--footer-name">{nameComponents.join(', ')}</div>
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
    if (!card.is_ad) {
      utils.cancelEvent(event);
    }

    if (this.state.isAnimating || !this.props.state.cards.length) {
      return;
    }

    this.setState({
      isMoving: true
    });
    this.lastDiff = 0;
    this.startX = event.touches[0].clientX;
    this.cancelTap = false;
  };

  _touchDidMove = (event) => {
    utils.cancelEvent(event);

    if (this.state.isAnimating) {
      return;
    }

    const centerX = window.innerWidth / 2;
    const diff = event.touches[0].clientX - this.startX;
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

  _touchDidEnd = (event) => {
    const card = this.props.state.cards[0];
    if (!card.is_ad) {
      utils.cancelEvent(event);
    }

    if (this.state.isAnimating || !this.props.state.cards.length) {
      return;
    }

    const percent = this.lastDiff / window.innerWidth;
    if (Math.abs(percent) >= 0.3) {
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
        this.setState({
          rotate: 0,
          diff: 0,
          isAnimating: false,
          likeButtonDiff: 0,
          likeButtonScale: 1,
          dislikeButtonDiff: 0,
          dislikeButtonScale: 1,
        });
      }, 200);
    } else {
      this.setState({
        rotate: 0,
        diff: 0,
        isMoving: false,
        likeButtonDiff: 0,
        likeButtonScale: 1,
        dislikeButtonDiff: 0,
        dislikeButtonScale: 1,
      });

      if (!this.cancelTap) {
        this._handleTap(event);
      }
    }
  };

  _handleTap(event) {
    const target = event.target;
    const card = this.props.state.cards[0];

    if (card.is_ad) {
      cardsActions.markAdAsSeen(card.id, true);
      return;
    }

    if (target.classList.contains('Cards__item--footer') || target.closest('.Cards__item--footer')) {
      actions.go(pages.PROFILE, {user: this.props.state.cards[0], fromLikes: false});
    } else {
      const isNext = this.startX > window.innerWidth / 2;
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
      return cardsActions.resolveSystemCard();
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
    }).catch((card) => {
        this._restoreCard(card, isLike);
        actions.showError('Произошла ошибка');
      });

    if (isLike) {
      this.likesCount++;

      if (this.likesCount >= 2) {
        cardsActions.requestNotificationsAccess();
      }

      utils.statReachGoal('card_like');
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
    }).catch(() => {
      this.setState({isLoading: false, isFailed: true});
    });
  };

  _likeButtonDidPress = (e) => {
    this.lastDiff = window.innerWidth;
    this._touchDidEnd(e);
  };

  _dislikeButtonDidPress = (e) => {
    this.lastDiff = -window.innerWidth;
    this._touchDidEnd(e);
  };

  _updateHeight = () => {
    const headerHeight = utils.getHeaderHeight();
    const footerHeight = utils.getTabBarHeight();
    const items = this.refs['items'];
    if (items) {
      items.style.height = (window.innerHeight - headerHeight - footerHeight) + 'px';
    }
  };

  _cancelAction = () => {
    const card = cardsActions.getLastDislikedCard();
    if (card) {
      this._restoreCard(card, false);
    }
  };

  _clearHiddenCard = () => {
    actions.showAlert('Показать снова', 'Все карточки, которые вы уже видели будут показаны снова, вы действительно хотите увидеть их?', 'Да, показать').then(() => {
      actions.loaderShow();
      cardsActions.clearSeenCards()
        .then(() => actions.loaderSuccess())
        .catch(() => actions.showError());
    });
  };
}
