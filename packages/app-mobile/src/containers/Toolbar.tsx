import React, { useMemo } from 'react';
import styled from 'styled-components';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { decode as decodeBase64 } from 'base-64';

import { useApplicationState, useDispatch } from 'noya-app-state-context';
import { DrawableLayerType } from 'noya-state';
import { decode } from 'noya-sketch-file';

import Button from '../components/Button';
import Layout from '../components/Layout';

interface ToolbarProps {}

function base64ToArrayBuffer(base64: string) {
  var binary_string = decodeBase64(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

const Toolbar: React.FC<ToolbarProps> = (props) => {
  const [state] = useApplicationState();
  const dispatch = useDispatch();

  const interType = state.interactionState.type;
  const layerType = useMemo(() => {
    if (state.interactionState.type === 'insert') {
      return state.interactionState.layerType;
    }

    if (state.interactionState.type === 'drawing') {
      return state.interactionState.shapeType;
    }

    return undefined;
  }, [state.interactionState]);

  const isButtonActive = (shape: DrawableLayerType) =>
    layerType === shape && (interType === 'drawing' || interType === 'insert');

  const onReset = () => {
    if (interType !== 'none') {
      dispatch('interaction', ['reset']);
    }
  };

  const onAddShape = (shape: DrawableLayerType) => () => {
    dispatch('interaction', ['insert', shape]);
  };

  const onOpenFile = async () => {
    try {
      const results = await DocumentPicker.getDocumentAsync({
        multiple: false,
        type: '*/*',
      });
      // console.log(results);

      if (results.type !== 'success') {
        return;
      }

      if (results.file) {
        const data = await results.file.arrayBuffer();
        const sketch = await decode(data);

        dispatch('setFile', sketch);
        return;
      }
      const fileString = await FileSystem.readAsStringAsync(results.uri, {
        encoding: 'base64',
      });
      const data = base64ToArrayBuffer(fileString);
      const sketch = await decode(data);
      dispatch('setFile', sketch);
    } catch (e) {
      console.log(e);
    }
  };

  const buttons = [
    {
      icon: 'cursor-arrow',
      onPress: onReset,
      active: interType === 'none' || interType === 'marquee',
    },
    {
      icon: 'frame',
      onPress: onAddShape('artboard'),
      active: isButtonActive('artboard'),
    },
    {
      icon: 'square',
      onPress: onAddShape('rectangle'),
      active: isButtonActive('rectangle'),
    },
    {
      icon: 'circle',
      onPress: onAddShape('oval'),
      active: isButtonActive('oval'),
    },
    {
      icon: 'slash',
      onPress: onAddShape('line'),
      active: isButtonActive('line'),
    },
    // { icon: 'share-1', onPress: onToDo },
    // { icon: 'text', onPress: onToDo },
    { icon: 'file', onPress: onOpenFile },
  ];

  return (
    <>
      <ToolbarView>
        <ToolbarContainer>
          {buttons.map(({ icon, onPress, active }, idx) => (
            <React.Fragment key={idx}>
              <Button icon={icon} onPress={onPress} active={active} />
              {idx !== buttons.length - 1 && <Layout.Queue size="medium" />}
            </React.Fragment>
          ))}
        </ToolbarContainer>
      </ToolbarView>
    </>
  );
};

export default React.memo(Toolbar);

const ToolbarView = styled.View((p) => ({
  bottom: 10,
  zIndex: 100,
  width: '100%',
  position: 'absolute',
  alignItems: 'center',
  justifyContent: 'center',
}));

const ToolbarContainer = styled.View((p) => ({
  flexDirection: 'row',
  paddingVertical: p.theme.sizes.spacing.small,
  paddingHorizontal: p.theme.sizes.spacing.medium,
  backgroundColor: p.theme.colors.sidebar.background,
  borderRadius: 10,
  // height: 100,
}));
