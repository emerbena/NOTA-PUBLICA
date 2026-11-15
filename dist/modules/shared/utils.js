import { IMAGE_ORIGIN } from './config.js';

export const normalize = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const image = (id, width = 800) =>
  `${IMAGE_ORIGIN}/${id}?auto=format&fit=crop&w=${width}&q=85`;
