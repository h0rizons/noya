import * as InspectorPrimitives from './InspectorPrimitives';
import {
  Sortable,
  Spacer,
  ListView,
  RelativeDropPosition,
  withSeparatorElements,
  IconButton,
  Button,
} from 'noya-web-designsystem';
import { memo, ReactNode, useCallback, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import { range } from 'noya-utils';

const ElementRow = styled.div({
  flex: '0 0 auto',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: '10px',
});

const ItemContainer = styled.div({
  position: 'relative',
});

interface ArrayControllerProps<Item> {
  id: string;
  items: Item[];
  title: ReactNode;
  sortable?: boolean;
  reversed?: boolean;
  expanded?: boolean;
  getKey?: (item: Item) => string;
  onMoveItem?: (sourceIndex: number, destinationIndex: number) => void;
  onClickPlus?: () => void;
  onClickTrash?: () => void;
  onClickExpand?: () => void;
  renderItem: (props: { item: Item; index: number }) => ReactNode;
  renderExpandedContent?: () => ReactNode;
}

function ArrayController<Item>({
  id,
  items,
  title,
  sortable = false,
  reversed = true,
  expanded = false,
  getKey,
  onMoveItem,
  onClickPlus,
  onClickTrash,
  onClickExpand,
  renderItem,
  renderExpandedContent,
}: ArrayControllerProps<Item>) {
  const iconColor = useTheme().colors.icon;
  const primaryLightColor = useTheme().colors.primaryLight;

  const keys = useMemo(
    () => items.map((item, index) => getKey?.(item) ?? index.toString()),
    [getKey, items],
  );

  const indexes = reversed
    ? range(0, items.length).reverse()
    : range(0, items.length);

  const handleMoveItem = useCallback(
    (
      sourceIndex: number,
      destinationIndex: number,
      position: RelativeDropPosition,
    ) => {
      if (reversed) {
        if (position === 'above') {
          position = 'below';
        } else if (position === 'below') {
          position = 'above';
        }
      }

      onMoveItem?.(
        sourceIndex,
        position === 'below' ? destinationIndex + 1 : destinationIndex,
      );
    },
    [onMoveItem, reversed],
  );

  const renderRow = (index: number) => {
    return (
      <ElementRow key={keys[index]}>
        {renderItem({ item: items[index], index: index })}
      </ElementRow>
    );
  };

  return (
    <InspectorPrimitives.Section id={id}>
      <InspectorPrimitives.SectionHeader>
        <Button variant="none" onClick={onClickPlus}>
          <InspectorPrimitives.Title>{title}</InspectorPrimitives.Title>
        </Button>
        <Spacer.Horizontal />
        {withSeparatorElements(
          [
            onClickTrash && (
              <IconButton
                id={`${id}-trash`}
                iconName="TrashIcon"
                color={iconColor}
                onClick={onClickTrash}
              />
            ),
            onClickExpand && (
              <IconButton
                id={`${id}-gear`}
                iconName="GearIcon"
                color={expanded ? primaryLightColor : iconColor}
                onClick={onClickExpand}
              />
            ),
            onClickPlus && (
              <IconButton
                id={`${id}-add`}
                iconName="PlusIcon"
                color={iconColor}
                onClick={onClickPlus}
              />
            ),
          ],
          <Spacer.Horizontal size={12} />,
        )}
      </InspectorPrimitives.SectionHeader>
      {sortable ? (
        <Sortable.Root
          keys={keys}
          renderOverlay={renderRow}
          onMoveItem={handleMoveItem}
        >
          {indexes.map((index) => (
            <Sortable.Item<HTMLDivElement> id={keys[index]} key={keys[index]}>
              {({ relativeDropPosition, ...sortableProps }) => (
                <ItemContainer {...sortableProps}>
                  {renderRow(index)}
                  {relativeDropPosition && (
                    <ListView.DragIndicatorElement
                      relativeDropPosition={relativeDropPosition}
                      offsetLeft={0}
                    />
                  )}
                </ItemContainer>
              )}
            </Sortable.Item>
          ))}
        </Sortable.Root>
      ) : (
        indexes.map(renderRow)
      )}
      {expanded && renderExpandedContent?.()}
    </InspectorPrimitives.Section>
  );
}

export default memo(ArrayController);
