import Sketch from 'noya-file-format';
import { useApplicationState, useWorkspace } from 'noya-app-state-context';
import { GridView, MenuItem } from 'noya-web-designsystem';
import { LayerPreview as RCKLayerPreview } from 'noya-renderer';
import { Selectors } from 'noya-state';
import { memo, useCallback, useMemo } from 'react';
import CanvasGridItem from '../components/theme/CanvasGridItem';

export type PageGridMenuItemType = 'duplicate' | 'delete' | 'rename';

interface PageGridItemProps {
  page: Sketch.Page;
}

const PageGridItem = memo(function PageGridItem({ page }: PageGridItemProps) {
  const frame = useMemo(
    () => Selectors.getPageContentBoundingRect(page),
    [page],
  );

  return (
    <CanvasGridItem
      renderContent={useCallback(
        (size) =>
          frame && (
            <RCKLayerPreview
              layer={page}
              layerFrame={frame}
              previewSize={size}
              scalingMode="down"
              padding={10}
            />
          ),
        [frame, page],
      )}
    />
  );
});

export default memo(function PagesGrid() {
  const { startRenamingPage } = useWorkspace();
  const [state, dispatch] = useApplicationState();
  const pages = state.sketch.pages;

  const menuItems: MenuItem<PageGridMenuItemType>[] = [
    { value: 'duplicate', title: 'Duplicate' },
    { value: 'rename', title: 'Rename' },
    { value: 'delete', title: 'Delete', disabled: pages.length === 1 },
  ];

  const handleSelectMenuItem = useCallback(
    (value: PageGridMenuItemType) => {
      switch (value) {
        case 'delete':
          dispatch('deletePage', state.selectedPage);
          break;
        case 'duplicate':
          dispatch('duplicatePage', state.selectedPage);
          break;
        case 'rename':
          startRenamingPage(state.selectedPage);
          break;
      }
    },
    [dispatch, startRenamingPage, state.selectedPage],
  );

  return (
    <GridView.Root variant="large" onClick={() => {}}>
      <GridView.SectionHeader title="Pages" />
      <GridView.Section>
        {pages.map((item) => {
          return (
            <GridView.Item
              id={item.do_objectID}
              key={item.do_objectID}
              title={item.name}
              menuItems={menuItems}
              selected={item.do_objectID === state.selectedPage}
              onSelectMenuItem={handleSelectMenuItem}
              onContextMenu={() => dispatch('selectPage', item.do_objectID)}
              onClick={() => dispatch('selectPage', item.do_objectID)}
              onDoubleClick={() => {
                dispatch('selectPage', item.do_objectID);
                dispatch('setTab', 'canvas');
              }}
            >
              <PageGridItem page={item} />
            </GridView.Item>
          );
        })}
      </GridView.Section>
    </GridView.Root>
  );
});
