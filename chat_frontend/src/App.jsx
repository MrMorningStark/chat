import { unstable_HistoryRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, theme } from '@chakra-ui/react';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import ChatRoom from './components/ChatRoom';
import WelcomeScreen from './components/WelcomeScreen';
import Home from './components/Home';
import { createBrowserHistory } from 'history';
const App = () => {
  const history = createBrowserHistory();
  return (
    <Provider store={store}>
      <ChakraProvider theme={theme}>
        <Router history={history}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/chats"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            >
              {/* Welcome screen shown by default */}
              <Route index element={<WelcomeScreen />} />
              {/* Individual chat route */}
              <Route path=":sid" element={<ChatRoom />} />
            </Route>
            <Route path="/" element={<Navigate to="/chats" />} />
          </Routes>
        </Router>
      </ChakraProvider>
    </Provider>
  );
};

export default App;