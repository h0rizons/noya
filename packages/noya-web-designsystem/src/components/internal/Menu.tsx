import styled from 'styled-components';
import { ApplicationMenuItem } from 'noya-embedded';
import { memo, ReactElement } from 'react';
import { CSSObject } from 'styled-components';
import { Theme } from '../../theme';
import { useDesignSystemConfiguration } from 'noya-ui';
import { getShortcutDisplayParts } from 'noya-keymap';
import withSeparatorElements from '../../utils/withSeparatorElements';

export const SEPARATOR_ITEM = 'separator';

export type RegularMenuItem<T extends string> = {
  value?: T;
  title: string;
  shortcut?: string;
  checked?: boolean;
  disabled?: boolean;
  icon?: ReactElement;
  items?: MenuItem<T>[];
  role?:
    | ApplicationMenuItem['role']
    | 'recentdocuments'
    | 'clearrecentdocuments';
};

export type MenuItem<T extends string> =
  | typeof SEPARATOR_ITEM
  | RegularMenuItem<T>;

export const CHECKBOX_WIDTH = 15;
export const CHECKBOX_RIGHT_INSET = 3;

export const styles = {
  separatorStyle: ({ theme }: { theme: Theme }): CSSObject => ({
    height: '1px',
    backgroundColor: theme.colors.divider,
    margin: '4px 8px',
  }),

  itemStyle: ({
    theme,
    disabled,
  }: {
    theme: Theme;
    disabled?: boolean;
  }): CSSObject => ({
    ...theme.textStyles.small,
    fontWeight: 500,
    fontSize: '0.8rem',
    flex: '0 0 auto',
    userSelect: 'none',
    cursor: 'pointer',
    borderRadius: '3px',
    padding: '4px 8px',
    ...(disabled && {
      color: theme.colors.textDisabled,
    }),
    '&:focus': {
      outline: 'none',
      color: 'white',
      backgroundColor: theme.colors.primary,

      '& kbd': {
        color: 'white',
      },
    },
    '&:active': {
      background: theme.colors.primaryLight,
    },
    display: 'flex',
    alignItems: 'center',
  }),

  itemIndicatorStyle: {
    display: 'flex',
    alignItems: 'center',
    left: `-${CHECKBOX_WIDTH / 2}px`,
    position: 'relative',
    marginRight: `-${CHECKBOX_RIGHT_INSET}px`,
  } as CSSObject,

  contentStyle: ({
    theme,
    scrollable,
  }: {
    theme: Theme;
    scrollable?: boolean;
  }): CSSObject => ({
    borderRadius: 4,
    backgroundColor: theme.colors.popover.background,
    color: theme.colors.text,
    boxShadow: '0 2px 4px rgba(0,0,0,0.2), 0 0 12px rgba(0,0,0,0.1)',
    padding: '4px',
    border: `1px solid ${theme.colors.divider}`,
    ...(scrollable && {
      height: '100%',
      maxHeight: 'calc(100vh - 80px)',
      overflow: 'hidden auto',
    }),
  }),
};

function getKeyboardShortcuts<T extends string>(
  item: MenuItem<T>,
): [string, T][] {
  if (item === SEPARATOR_ITEM) return [];

  if (item.items) return item.items.flatMap(getKeyboardShortcuts);

  if (item.disabled || !item.value || !item.shortcut) return [];

  return [[item.shortcut, item.value]];
}

export function getKeyboardShortcutsForMenuItems<T extends string>(
  menuItems: MenuItem<T>[],
  onSelect: (type: T) => void,
): Record<string, () => void> {
  return Object.fromEntries(
    menuItems
      .flatMap(getKeyboardShortcuts)
      .map(([key, value]) => [key, () => onSelect(value)]),
  );
}

const ShortcutElement = styled.kbd(
  ({
    theme,
    fixedWidth,
  }: {
    theme: Theme;
    fixedWidth?: boolean;
  }): CSSObject => ({
    ...theme.textStyles.small,
    color: theme.colors.textDisabled,
    ...(fixedWidth && {
      width: '0.9rem',
      textAlign: 'center',
    }),
  }),
);

export const KeyboardShortcut = memo(function KeyboardShortcut({
  shortcut,
}: {
  shortcut: string;
}) {
  const platform = useDesignSystemConfiguration().platform;

  const { keys, separator } = getShortcutDisplayParts(shortcut, platform);

  const keyElements = keys.map((key) => (
    <ShortcutElement
      key={key}
      fixedWidth={platform === 'mac' && key.length === 1}
    >
      {key}
    </ShortcutElement>
  ));

  return (
    <>
      {separator
        ? withSeparatorElements(
            keyElements,
            <ShortcutElement>{separator}</ShortcutElement>,
          )
        : keyElements}
    </>
  );
});
