import React, {
  memo,
  useMemo,
  useState,
  useCallback,
  ReactElement,
} from 'react';
import { View } from 'react-native';
import styled from 'styled-components';
import Animated, {
  withSpring,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import Layout from './Layout';
import Button from './Button';
import BoxView from './BoxView';

type ExpandablePosition = 'left' | 'right';

interface Tab {
  id: string;
  icon: string;
}

type ExpandableChild = ReactElement<Tab>;

type ExpandableProps = {
  children: ExpandableChild | ExpandableChild[];
  position?: ExpandablePosition;
};

interface ExpandableViewProps {
  position: ExpandablePosition;
}

const ExpandableProvider = (props: ExpandableProps) => {
  const { position = 'left', children } = props;
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const expandableOffset = useSharedValue(position === 'left' ? -250 : 250);

  const tabs = useMemo(() => {
    const tabs: Tab[] = [];

    if (children instanceof Array) {
      children.forEach((child) => {
        tabs.push({
          id: child.props.id,
          icon: child.props.icon,
        });
      });
    } else {
      tabs.push({
        id: children.props.id,
        icon: children.props.icon,
      });
    }

    return tabs;
  }, [children]);

  const onToggleTab = useCallback(
    (tab: string) => {
      if (activeTab === tab) {
        setActiveTab(null);
        expandableOffset.value = position === 'left' ? -250 : 250;
      } else {
        setActiveTab(tab);
        expandableOffset.value = 0;
      }
    },
    [position, expandableOffset, activeTab, setActiveTab],
  );

  const activeChild = useMemo(() => {
    if (children instanceof Array) {
      return children.find((child) => child.props.id === activeTab);
    }

    return children.props.id === activeTab ? children : null;
  }, [children, activeTab]);

  const expandableStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(expandableOffset.value, {
          damping: 20,
          stiffness: 200,
        }),
      },
    ],
  }));

  return (
    <ExpandableView position={position} style={expandableStyle}>
      <ExpandableContentWrapper>
        {!!activeChild && <ExpandableContent>{activeChild}</ExpandableContent>}
      </ExpandableContentWrapper>
      <Layout.Queue size="medium" />
      <View>
        <BoxView>
          {tabs.map((tab, idx) => (
            <React.Fragment key={tab.id}>
              <Button
                icon={tab.icon}
                onPress={() => onToggleTab(tab.id)}
                active={activeTab === tab.id}
              />
              {idx !== tabs.length - 1 && <Layout.Stack size="medium" />}
            </React.Fragment>
          ))}
        </BoxView>
      </View>
    </ExpandableView>
  );
};

export const Expandable = memo(ExpandableProvider);

const ExpandableView = styled(Animated.View)<ExpandableViewProps>((p) => {
  const common = {
    zIndex: 100,
    top: 0,
    bottom: 0,
    padding: 10,
  };

  if (p.position === 'left') {
    return {
      position: 'absolute',
      flexDirection: 'row',
      ...common,
      left: 0,
    };
  }

  return {
    position: 'absolute',
    flexDirection: 'row-reverse',
    ...common,
    right: 0,
  };
});

const ExpandableContentWrapper = styled(View)((_p) => ({
  width: 250,
}));

const ExpandableContent = styled(BoxView)((_p) => ({
  width: 250,
  flex: 1,
}));
