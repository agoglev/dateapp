import './TabBar.css';
import React, { Component } from 'react';
import * as utils from '../../utils';
import * as actions from '../../actions';
import * as activityActions from '../../actions/activity';
import Icon24Back from '@vkontakte/icons/dist/24/live';

export default class TabBar extends Component {
  componentDidMount() {
    //if (!window.isDG) {
      //utils.initYAAds('R-A-325915-2');
      //utils.initMyTargetAds();
    //} else if (utils.isIOS()) {
      //utils.initYAAds('R-A-325915-3');
    //}

    if (window.isDesktop && window.isDG && !this.props.state.hasPremium) {
      //utils.initVkAds();
    }
  }

  render() {
    return (
      <div className="TabBar">
        <div className="TabBar__cont">
          {this._renderTabs()}
        </div>
        <div className="TabBar__helper" />
        <div className="TabBar__ads">
          <div id="yandex_rtb" />
        </div>
      </div>
    )

    /*
   <div style={{textAlign: 'center'}}>
          <ins className="mrg-tag" style={{display: 'inline-block', width: '320px', height: '50px'}} data-ad-client="ad-331172"
               data-ad-slot="331172" />
        </div>
     */
  }

  _renderTabs() {
    const state = this.props.state;

    if (['join', 'error'].indexOf(state.activeTab) > -1) {
      return this._renderLinks();
    }

    let tabs = ['search', 'cards', 'messages', 'profile'];
    //if (window.isDG || state.usersInfo[state.userId] && parseInt(state.usersInfo[state.userId].gender, 10) === 1 || state.userId === 1) {
    //  tabs.unshift('date_chats');
    //}

    const TitlesMap = {
      search: 'Люди',
      cards: 'Карточки',
      messages: 'Сообщения',
      profile: 'Профиль'
    };

    return tabs.map((tab) => {
      const className = utils.classNames({
        TabBar__item: true,
        active: state.activeTab === tab,
        hasBadge: tab === 'messages' && this.props.state.hasBadge
      });

      return (
        <div
          className={className}
          onClick={() => {
            window.scrollTo(0, 0);
            actions.setTab(tab);
          }}
          key={tab}
        >
          <div className={`TabBar__item-icon ${tab}`}>
            {this._getIcon(tab)}
          </div>
          <div className="TabBar__item-title">{TitlesMap[tab]}</div>
        </div>
      )
    });
  }

  _getIcon(tab) {
    if (tab === 'messages') {
      return <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg"><path d="M3.575 20.622c-1.398-.707.149-2.408.505-4.754a7.723 7.723 0 0 1-1.003-3.809C3.077 7.61 6.865 4 11.538 4 16.212 4 20 7.608 20 12.06c0 4.45-3.788 8.059-8.462 8.059-.68 0-1.341-.077-1.975-.221-1.923 1.165-4.64 1.406-5.988.724zM8.54 18.17l.683-.414.777.177a6.92 6.92 0 0 0 1.538.172c3.6 0 6.471-2.735 6.471-6.045s-2.87-6.044-6.47-6.044c-3.6 0-6.471 2.734-6.471 6.044 0 .994.256 1.95.74 2.81l.345.61-.105.695c-.113.74-.302 1.405-.602 2.24l-.207.574c.94.053 2.317-.223 3.301-.82z" fill="#e6457a" fillRule="nonzero"/></svg>;
    } else if (tab === 'cards') {
      return <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg"><path d="M17.224 4.092l1.303.23c1.627.287 2.253.586 2.834 1.042.581.457.996 1.05 1.227 1.752.23.703.296 1.393.01 3.02l-1.036 5.872c-.287 1.627-.586 2.253-1.042 2.835a3.635 3.635 0 0 1-1.752 1.226c-.484.158-.962.24-1.744.18a5.74 5.74 0 0 0 .797-2.003c.115-.016.22-.043.325-.078.326-.107.588-.29.8-.56.285-.362.436-.752.646-1.947l1.036-5.873c.21-1.195.202-1.612.059-2.05a1.635 1.635 0 0 0-.561-.8c-.362-.284-.751-.436-1.946-.646l-.279-.05c-.11-.842-.32-1.482-.672-2.139a5.774 5.774 0 0 0-.005-.01zM7.128 3h3.744c1.783 0 2.43.186 3.082.534.652.349 1.163.86 1.512 1.512.348.652.534 1.299.534 3.082v7.744c0 1.783-.186 2.43-.534 3.082a3.635 3.635 0 0 1-1.512 1.512c-.652.348-1.299.534-3.082.534H7.128c-1.783 0-2.43-.186-3.082-.534a3.635 3.635 0 0 1-1.512-1.512C2.186 18.302 2 17.655 2 15.872V8.128c0-1.783.186-2.43.534-3.082a3.635 3.635 0 0 1 1.512-1.512C4.698 3.186 5.345 3 7.128 3zm0 2c-1.324 0-1.727.078-2.138.298-.304.162-.53.388-.692.692C4.078 6.4 4 6.804 4 8.128v7.744c0 1.324.078 1.727.298 2.138.162.304.388.53.692.692.411.22.814.298 2.138.298h3.744c1.324 0 1.727-.078 2.138-.298.304-.162.53-.388.692-.692.22-.411.298-.814.298-2.138V8.128c0-1.324-.078-1.727-.298-2.138a1.635 1.635 0 0 0-.692-.692C12.6 5.078 12.196 5 10.872 5H7.128z" fill="#E63973" fillRule="nonzero"/></svg>;
    } else if (tab === 'profile') {
      return <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg"><path d="M12 13a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-7.051 9.316a1 1 0 1 1-1.897-.632C4.178 16.304 7.484 14.5 12 14.5s7.822 1.803 8.948 5.184a1 1 0 0 1-1.897.632C18.234 17.863 15.734 16.5 12 16.5s-6.234 1.363-7.051 3.816z" fill="#e6457a" fillRule="nonzero"/></svg>;
    } else if (tab === 'date_chats') {
      return <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg"><path d="M19.492 18.626c3.393-3.835 3.332-9.602-.09-13.355a1 1 0 1 1 1.477-1.348c4.11 4.506 4.183 11.426.111 16.028a1 1 0 1 1-1.498-1.325zm-3.894-3.153a5 5 0 0 0-.006-6.952 1 1 0 0 1 1.436-1.393 7 7 0 0 1 .008 9.735 1 1 0 1 1-1.438-1.39zM12 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm-5.04 2.862a7 7 0 0 1 .01-9.734A1 1 0 0 1 8.404 8.52a5 5 0 0 0-.006 6.953 1 1 0 1 1-1.439 1.389zm-2.45 1.764a1 1 0 1 1-1.497 1.325C-1.06 15.35-.986 8.43 3.123 3.923a1 1 0 1 1 1.479 1.348c-3.423 3.753-3.484 9.52-.092 13.355z" fill="#E63973" fillRule="nonzero"/></svg>;
    } else if (tab === 'search') {
      return <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg"><path d="M16.463 15.05l4.244 4.243a1 1 0 0 1-1.414 1.414l-4.244-4.244a7.5 7.5 0 1 1 1.414-1.414zM10.5 16a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z" fill="currentColor" fillRule="evenodd"/></svg>;
    }
  }

  _renderLinks() {
    let links = [{
      title: 'Сообщество',
      href: window.isOK ? 'https://ok.ru/group/59095003234338' : 'https://vk.com/dateapp'
    }];

    if (!window.isOK) {
      links.push({
        title: 'Сообщить о проблеме',
        href: 'https://vk.com/board160479731'
      });
      links.push({
        title: 'Связаться с разработчиками',
        href: 'https://vk.me/dateapp'
      });
    }
    return links.map((link, i) => {
      return (
        <a key={i} href={link.href} target="_blank" className="TabBar__link">{link.title}</a>
      )
    });
  }
}
