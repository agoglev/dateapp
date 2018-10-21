import * as actionTypes from './actionTypes';
import store from '../store';
import * as actions from './index'
import * as api from '../services/api';
import * as utils from '../utils';
import * as pages from '../constants/pages';

let Countries = false;
export function loadCountries() {
  return new Promise((resolve, reject) => {
    if (Countries) {
      resolve(Countries);
    } else {
      api.method(api.methods.countries)
        .then((resp) => {
          resolve(resp);
          Countries = resp;
        })
        .catch(reject);
    }
  });
}

let Cities = {};
export function loadCities(countryId, q, fast = false) {
  return new Promise((resolve, reject) => {
    if (!Cities[countryId]) {
      Cities[countryId] = {};
    }
    if (Cities[countryId][q]) {
      resolve([Cities[countryId][q], q]);
    } else {
      utils.throttle('search_city', () => {
        api.method(api.methods.cities, {
          country_id: countryId,
          q
        }).then((resp) => {
          resolve([resp, q]);
          Cities[countryId][q] = resp;
        }).catch(reject);
      }, fast ? 0 : 1000);
    }
  });
}