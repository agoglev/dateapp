import * as activityActions from '../actions/activity';
import store from '../store';
import * as accountActions from "../actions/account";

let lastEventId = 0;
let socket = null;

let ppTimer = null;
let pongTimer = null;

export default function init() {
  connect();
}

function connect() {
  const { userId, token } = store.getState();

  const host = 'dateapp.ru'; //location.host;
  socket = new WebSocket('wss://' + host + '/ws?id=' + userId + '&last_event_id=' + lastEventId + '&token=' + token);
  socket.onopen = function() {
    startPingPong();
  };

  socket.onclose = connectionDidClose;
  socket.onmessage = messageDidReceive;

  socket.onerror = function(error) {
    console.log("ws err:", error.message);
  };
}

function startPingPong() {
  clearTimeout(ppTimer);
  ppTimer = setTimeout(() => {
    socket.send('ping');
    pongTimer = setTimeout(function () {
      socket.close();
    }, 2000);
  }, 5000);
}

function connectionDidClose() {
  setTimeout(connect, 3000);
  clearTimeout(ppTimer);
  clearTimeout(pongTimer);
}

function messageDidReceive(e) {
  if (e.data === 'pong') {
    clearTimeout(pongTimer);
    startPingPong();
    return;
  }

  const data = JSON.parse(e.data);

  let event;
  if (data.Event.Event.chat_event) {
    event = data.Event.Event;
  } else {
    event = JSON.parse(data.Event.Event);
  }

  if (lastEventId > 0 && data.Event.Id < lastEventId) {
    console.log('SKIP');
    return
  }

  lastEventId = data.Event.Id;

  switch (event.type) {
    case 'new_message':
      activityActions.newMessageEventDidReceive(event.api_dialog);
      break;
    case 'read_history':
      activityActions.readHistoryEventDidReceive(parseInt(event.peer_id, 10));
      break;
    case 'typing':
      //Im.didTyping(parseInt(event.peer_id));
      break;
    case 'balance_update':
      //cur.balance = event.balance;
      //$('#profile_balance').html(event.balance_str);
      break;
    case 'badge':
      accountActions.showBadge();
      break;
    case 'like':
      activityActions.newLikeEventDidReceive(event.like);
      break;
    case 'feature':
      activityActions.loadFeaturedUsers();
      break;
  }
}