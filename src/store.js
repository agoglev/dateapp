import { createStore } from 'redux';
import rootReducer from './reducers';

function configureStore(initialState) {
  const method = window.devToolsExtension ? window.devToolsExtension()(createStore) : createStore;
  const store = method(rootReducer, initialState);
  if (module.hot) {
    module.hot.accept('./reducers', () => {
      const nextReducer = require('./reducers').default;
      store.replaceReducer(nextReducer);
    });
  }
  return store;
}

const store = configureStore();
export default store
