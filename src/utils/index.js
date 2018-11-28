import * as loadImage from 'blueimp-load-image';
import * as actions from "../actions";
import * as actionTypes from '../actions/actionTypes';
import store from '../store';
import Cards from '../containers/Main/Cards';
import connect from '@vkontakte/vkui-connect';

export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

export function classNames() {
  let result = [];

  [].concat(Array.prototype.slice.call(arguments)).forEach(function (item) {
    if (!item) {
      return;
    }
    switch (typeof item === 'undefined' ? 'undefined' : typeof item) {
      case 'string':
        result.push(item);
        break;
      case 'object':
        Object.keys(item).forEach(function (key) {
          if (item[key]) {
            result.push(key);
          }
        });
        break;
      default:
        result.push('' + item);
    }
  });

  return result.join(' ');
}

const _throttleHelper = {};
export function throttle(ident, func, wait) {
  if (!_throttleHelper[ident]) {
    _throttleHelper[ident] = {};
  }

  clearTimeout(_throttleHelper[ident].timer);
  _throttleHelper[ident].func = func;
  _throttleHelper[ident].timer = setTimeout(() => {
    _throttleHelper[ident].func();
  }, wait);
}

export function isDev() {
  return window.location.hostname === 'localhost' || window.location.hostname.match(/^\d+.\d+.\d+.\d+$/)
}

export function isInspectOpen() {
  console.profile();
  console.profileEnd();
  if (console.clear) console.clear();
  return console.profile.length > 0;
}

export function cancelEvent(e) {
  e = e || window.event;

  if (!e) {
    return false;
  }
  if (e.originalEvent) {
    e = e.originalEvent;
  }
  e.preventDefault();
  e.stopPropagation();
  e.returnValue = false;
  return false;
}

export function getTabBarHeight() {
  if (window.isDesktop) {
    return 0;
  }
  const el = document.querySelector('.TabBar');
  if (!el) {
    return 0;
  }
  let height = el.offsetHeight;
  const helperHeight = document.querySelector('.TabBar__helper').offsetHeight;

  if (store.getState().tabBarAdsShown) {
    //height += 50;
  }

  return height + helperHeight;
}

export function getHeaderHeight() {
  const el = document.querySelector(window.isDesktop ? '.App__desktop__header' : '.View__header');
  let height = el ? el.offsetHeight : 0;
  return height;
}

export function genderText(gender, variants) { // gender 2 is female
  return parseInt(gender, 10) === 2 ? variants[0] : variants[1];
}

export function dateFormatShort(ts) {
  const curDate = new Date();
  const dt = Math.floor((curDate.getTime() - ts) / 1000);
  const days = Math.floor(dt / 86400);

  if (days === 0) {
    return 'сегодня';
  } else if (days === 1) {
    return 'вчера';
  } else {
    const date = new Date(ts);
    const months = ["Января","Февраля","Марта","Апреля","Мая","Июня","Июля","Августа","Сентября","Октября", "Ноября","Декабря"];

    if (date.getFullYear() === curDate.getFullYear()) {
      return date.getDate() + ' ' + months[date.getMonth()]
    }
    return date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear()
  }
}

export function proccessImage(file) {
  return new Promise((resolve, reject) => {
    loadImage.parseMetaData(file, (data) => {
      let orientation = 0;
      if (data.exif) {
        orientation = data.exif.get('Orientation');
      }
      const loadingImage = loadImage(
        file,
        (canvas) => {
          const base64data = canvas.toDataURL('image/jpeg');
          const blobBin = atob(base64data.split(',')[1]);
          let array = [];
          for(let i = 0; i < blobBin.length; i++) {
            array.push(blobBin.charCodeAt(i));
          }
          const newFile = new Blob([new Uint8Array(array)], {type: 'image/png'});
          resolve({
            file: newFile,
            base64: base64data,
            width: canvas.width,
            height: canvas.height,
          });
        }, {
          canvas: true,
          orientation: orientation,
          maxWidth: 600
        }
      );
    });
  });
}

export function getUsrAge(ts) {
  const birthday = new Date(ts * 1000);
  const ageDifMs = Date.now() - birthday.getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export function isAndroid() {
  return actions.clientPlatform === 'android';
}

export function isAppVersion(major, minor = 0) {
  return actions.clientVersion.major >= major && actions.clientVersion.minor >= minor;
}

export function isIOS() {
  return !!navigator.platform && /ipad|iphone|ipod/.test(navigator.platform.toLowerCase());
}

export function canAuthWithSig() {
  return false;
  if (isAndroid()) {
    return isAppVersion(5, 20);
  } else {
    return isAppVersion(5);
  }
}

let StatsQueue = [];
export function statReachGoal(eventName) {
  if (isDev()) {
    return;
  }
  if (window.yaCounter50682085 && window.yaCounter50682085.reachGoal) {
    window.yaCounter50682085.reachGoal(eventName);
  } else {
    StatsQueue.push(eventName);
  }
}

let yandexAdsInited = false;
let yandexAdsIniting = false;
export function initYAAds(isDG) {
  initYABlock(isDG);
  /*if (yandexAdsInited) {
    initYABlock();
  } else {
    if (!yandexAdsIniting) {
      yandexAdsIniting = true;
      (function (w, d, n, s, t) {
        w[n] = w[n] || [];
        w[n].push(function () {
          yandexAdsInited = true;
          initYABlock();
        });
        t = d.getElementsByTagName("script")[0];
        s = d.createElement("script");
        s.type = "text/javascript";
        s.src = "//an.yandex.ru/system/context.js";
        s.async = true;
        t.parentNode.insertBefore(s, t);
      })(window, window.document, "yandexContextAsyncCallbacks");
    }
  }*/
}

function initYABlock(isDG) {
  if (!window.Ya || !window.Ya.Context) {
    return;
  }
  window.Ya.Context.AdvManager.render({
    blockId: isDG ? "R-A-325915-3" : "R-A-325915-2",
    renderTo: "yandex_rtb_R-A-325915-2",
    onRender: function() {
      setTimeout(() => {
        Cards.shared && Cards.shared._updateHeight();
      }, 200);
    }
  });
  store.dispatch({type: actionTypes.ADS_UPDATE, shown: true});
}

export function initYAActivityBlock() {
  if (!window.Ya || !window.Ya.Context) {
    return;
  }
  window.Ya.Context.AdvManager.render({
    blockId: "R-A-159294-836",
    renderTo: "yandex_rtb_R-A-159294-836"
  });
  store.dispatch({type: actionTypes.ADS_UPDATE, shown: true});
}

export function stripHTML(e){return e?e.replace(/<(?:.|\s)*?>/g,""):""}

let myTargetInited = false;
export function initMyTargetAds() {
  if (myTargetInited) {
    return;
  }
  myTargetInited = true;
  setTimeout(() => {
    (window.MRGtag = window.MRGtag || []).push({});
    const script = document.createElement('script');
    script.src = 'https://ad.mail.ru/static/ads-async.js';
    document.getElementsByTagName('head')[0].appendChild(script);
  }, 1000);
}

export function preventDefault(e) {
  const event = e.nativeEvent;
  event.preventDefault();
  event.stopPropagation();
  event.returnValue = false;
}

export function gram(number, variants, skipNumber) {
  const cases = [2, 0, 1, 1, 1, 2];
  let res = (variants[ (number%100>4 && number%100<20)? 2 : cases[(number%10<5)?number%10:5]]);
  if (!skipNumber) {
    res = number+' '+res;
  }
  return res;
}

export function updateVkFrameHeight() {
  if (window.isDG) {
    //window.VK.callMethod('resizeWindow', window.innerWidth, Math.max(window.vkHeight - 167, 600));
  } else {
    //connect.send('VKWebAppResizeWindow', {width: 795, height: 600});
  }
}
