// Environment configuration
const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:5051';
};

const ENV = {
  development: {
    API_URL: getApiUrl()
  },
  production: {
    API_URL: getApiUrl()
  }
};

const isDev = import.meta.env.DEV;
export const API_URL = isDev ? ENV.development.API_URL : ENV.production.API_URL;

export default {
  API_URL,
  isDev
};
