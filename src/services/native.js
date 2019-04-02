import * as actions from "../actions";
import * as api from "./api";

let selectPhotohandler;
let purchaseHandler;

export function sendEvent(type, data = {}) {
  if (!window.isNative) {
    return;
  }
  window.ReactNativeWebView.postMessage(JSON.stringify({
    type,
    data
  }));
}

export function logout(skipError = false) {
  sendEvent('auth_failed', {
    skipError
  });
}

export function saveToken(token) {
  sendEvent('token', token);
}

export function selectPhoto(type, handler) {
  sendEvent('select_photo');
  selectPhotohandler = handler;
}

export function listen() {
  document.addEventListener('message', (e) => {
    let event;
    try {
      event = JSON.parse(e.data);
    } catch(e) {
      return;
    }

    switch (event.type) {
      case 'purchase_success':
        if (purchaseHandler) {
          purchaseHandler.resolve(event.transaction);
          purchaseHandler = null;
        }
        break;
      case 'purchase_failed':
        if (purchaseHandler) {
          purchaseHandler.reject();
          purchaseHandler = null;
        }
        break;
    }
  });
}

export function purchase(productId) {
  return new Promise((resolve, reject) => {
    sendEvent('purchase', {
      productId
    });
    purchaseHandler = {
      resolve: (transaction) => {
        api.method(api.methods.nativePurchase, {
          type: productId,
          transaction: JSON.stringify(transaction)
        }).then(() => {
          resolve();
        }).catch(() => reject());
      },
      reject: () => reject()
    };
  });
}