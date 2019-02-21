import connect from "@vkontakte/vkui-connect/index";

let promises = {};

function bindEvents() {

}

export default {
  init() {
    return new Promise((resolve, reject) => {
      const params = window.urlParams;
      var rParams = window.FAPI.Util.getRequestParameters(window.queryStr);

      window.FAPI.init(rParams["api_server"], rParams["apiconnection"],
        /*
        * Первый параметр:
        * функция, которая будет вызвана после успешной инициализации.
        */
        function() {
          window.okSession = params.get('session_key');
          window.okSecretSession = params.get('session_secret_key');
          resolve();
        },
        /*
        * Второй параметр:
        * функция, которая будет вызвана, если инициализация не удалась.
        */
        function(error) {
          reject(error);
        }
      );
    });
  },

  allowMessagesFromGroup(groupId) {
    return new Promise((resolve, reject) => {
      reject();
    });
  },

  getGeodata() {
    return new Promise((resolve, reject) => {
      reject();
    });
  }
}
