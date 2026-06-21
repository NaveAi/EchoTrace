import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import EchoTraceWidget from '../widget/EchoTraceWidget';
import { TraceProvider } from '../src/store/traceStore';

export default function App() {
  return (
    <TraceProvider>
      <SafeAreaView style={styles.container}>
        <EchoTraceWidget />
      </SafeAreaView>
    </TraceProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
