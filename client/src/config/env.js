// Environment configuration
const ENV = {
  development: {
    API_URL: 'http://localhost:5051'
  },
  production: {
    API_URL: 'https://your-backend-url.run.app' // Will be updated after Cloud Run deployment
  }
};

const isDev = import.meta.env.DEV;
export const API_URL = isDev ? ENV.development.API_URL : ENV.production.API_URL;

export default {
  API_URL,
  isDev
};
