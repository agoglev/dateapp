export function sendEvent(type, data = {}) {
  window.postMessage(JSON.stringify({
    type,
    data
  }), '*');
}

export function logout(skipError = false) {
  sendEvent('auth_failed', {
    skipError
  });
}

export function saveToken(token) {
  sendEvent('token', token);
}
