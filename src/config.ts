// Данные матчей — файл data/matches.json из этого репозитория, отданный по HTTP.
const OWNER = 'Interlabs22';
const REPO = 'test-app';
const BRANCH = 'main';

// Адрес менять не нужно.
export const MATCHES_URL =
    `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/data/matches.json`;
