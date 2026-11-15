import { SAVED_STORIES_KEY } from '../shared/config.js';

// El acceso a localStorage también puede fallar al obtener la propiedad.
export function readSavedStories(stories, storage) {
  try {
    const items = JSON.parse(
      (storage ?? globalThis.localStorage).getItem(SAVED_STORIES_KEY) || '[]',
    );
    return new Set(
      Array.isArray(items) ? items.filter((id) => stories.some((story) => story.id === id)) : [],
    );
  } catch {
    return new Set();
  }
}

export function writeSavedStories(saved, storage) {
  try {
    (storage ?? globalThis.localStorage).setItem(SAVED_STORIES_KEY, JSON.stringify([...saved]));
    return true;
  } catch {
    return false;
  }
}
