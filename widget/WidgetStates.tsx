import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useTraceStore } from '../src/store/traceStore';
import { connectToPartner } from '../src/services/pairing';

export default {
  PairingView: PairingView,
  WaitingView: WaitingView,
  PresenceView: PresenceView,
  DisconnectedView: DisconnectedView,
};

function PairingView() {
  const { deviceId } = useTraceStore();
  const [partnerCode, setPartnerCode] = React.useState('');
  const [role, setRole] = React.useState<'sender' | 'receiver'>('receiver');

  const onConnect = async () => {
    try {
      await connectToPartner(deviceId!, partnerCode, role);
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <View style={styles.center}>
      <Text style={styles.title}>EchoTrace</Text>
      <Text style={styles.label}>קוד אישי:</Text>
      <Text style={styles.code}>{deviceId || '---'}</Text>

      <TextInput
        placeholder="קוד שותף"
        value={partnerCode}
        onChangeText={setPartnerCode}
        style={styles.input}
      />
      <TouchableOpacity onPress={onConnect} style={styles.button}>
        <Text style={styles.buttonText}>התחבר</Text>
      </TouchableOpacity>
    </View>
  );
}

function WaitingView() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>מחכה ל-Trace ראשון</Text>
    </View>
  );
}

function PresenceView() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>נוכחות</Text>
    </View>
  );
}

function DisconnectedView() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>הקשר נותק</Text>
      <Text style={styles.small}>לחיצה ארוכה להתחיל זיווג חדש</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, marginBottom: 12 },
  label: { fontSize: 12, color: '#666' },
  code: { fontSize: 14, marginBottom: 12 },
  input: {
    width: '80%',
    padding: 8,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 6,
    marginTop: 8,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#3b3b3b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: { color: '#fff' },
  small: { color: '#888', marginTop: 8, fontSize: 12 },
});
