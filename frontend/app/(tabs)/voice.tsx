import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
} from 'expo-audio';
import * as Speech from 'expo-speech';

import { useState, useEffect } from 'react';
import { View, StyleSheet, Button, Alert } from 'react-native'; 
import { sendVoice } from '../../services/api';
import React from 'react';

export default function Voice() {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [recorded, setRecorded] = useState(false);
  const [texto, setTexto] = useState('');

  const record = async () => {
    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
    setRecorded(false);
  };

  const stopRecording = async () => {
    await audioRecorder.stop();
  
    const uri = audioRecorder.uri;
    if (!uri) return;
    const data = await sendVoice(uri);
    setTexto(data.texto);
    setRecorded(true);

  };

  const speak = () => {
    if (texto) Speech.speak(texto, { language: 'es' });
  };

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission to access microphone was denied');
      }

      setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Button
        title={recorderState.isRecording ? 'Stop Recording' : 'Start Recording'}
        onPress={recorderState.isRecording ? stopRecording : record}
      />
      {recorded && (<Button 
      title="Press to hear" 
      onPress={speak} />)}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    padding: 10,
  },
});
