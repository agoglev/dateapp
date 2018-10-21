import store from '../store';

export function getGiftById(id) {
  const gifts = store.getState().gifts;
  for (let i = 0; i < gifts.length; i++) {
    if (gifts[i].id === id) {
      return gifts[i];
    }
  }

  return false;
}