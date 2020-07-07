import React from 'react';
import {BrowserRouter as Router, Switch} from 'react-router-dom';

import Main from './components/main.js';

import './App.css';

/**
 * Initial Component to contain the app
 * @return {ReactComponent} <App/>
 */
export default function App() {
  return (
    <Router>
      <Switch path="/">
        <Main/>
      </Switch>
    </Router>
  );
}
