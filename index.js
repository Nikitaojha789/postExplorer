/**
 * Entry point. Keep it tiny: polyfills first, then bootstrap, then register.
 */
import './src/app/bootstrap/polyfills';

import { AppRegistry } from 'react-native';

import { name as appName } from './app.json';
import { Root } from './src/app/App';
import { bootstrap } from './src/app/bootstrap/bootstrap';

bootstrap();

AppRegistry.registerComponent(appName, () => Root);
