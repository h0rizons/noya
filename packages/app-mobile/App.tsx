import 'react-native-gesture-handler';
import '@shopify/react-native-skia';
import React from 'react';
import { SafeAreaView, StatusBar, useColorScheme } from 'react-native';

// import * as noyaUtils from 'noya-utils';

// eslint-disable-next-line
import { Theme } from './src/constants';
// eslint-disable-next-line
import Editor from './src/components/Editor';

const App = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const backgroundStyle = {
    flex: 1,
    backgroundColor: Theme[colorScheme ?? 'light'].backgroundColor,
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Editor />
    </SafeAreaView>
  );
};

export default App;
