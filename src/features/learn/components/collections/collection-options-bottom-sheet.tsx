import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import type { Collection } from '../../types';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUniwind } from 'uniwind';
import colors from '@/components/ui/colors';
import { CollectionCreateForm } from './collection-create-form';
import { CollectionDeleteConfirm } from './collection-delete-confirm';
import { CollectionEditForm } from './collection-edit-form';
import { CollectionMenuView } from './collection-menu-view';

type Props = {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  collection: Collection | null;
  mode?: 'OPTIONS' | 'CREATE';
  onCreated?: (collection: Collection) => void;
  onSaveEdit?: (collection: Collection) => void;
  onDelete?: (collection: Collection) => void;
  onStudy?: (collection: Collection) => void;
};

export function CollectionOptionsBottomSheet({
  bottomSheetRef,
  collection,
  mode = 'OPTIONS',
  onCreated,
  onSaveEdit,
  onDelete,
  onStudy,
}: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useUniwind();
  const isDark = theme === 'dark';
  const [currentView, setCurrentView] = React.useState<'MENU' | 'EDIT' | 'DELETE'>('MENU');

  const handleDismiss = () => {
    setCurrentView('MENU');
  };

  const renderBackdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  const handleClose = () => {
    bottomSheetRef.current?.dismiss();
  };

  const handleCreated = (newCollection: Collection) => {
    handleClose();
    onCreated?.(newCollection);
  };

  const handleSaveEdit = (updatedCollection: Collection) => {
    handleClose();
    onSaveEdit?.(updatedCollection);
  };

  const handleDeleteSuccess = () => {
    if (!collection) {
      return;
    }
    const target = collection;
    handleClose();
    onDelete?.(target);
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      enableDynamicSizing
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      onDismiss={handleDismiss}
      handleIndicatorStyle={{ backgroundColor: isDark ? colors.darkTheme.border : '#CBD5E1', width: 36, height: 4 }}
      backgroundStyle={{
        backgroundColor: isDark ? colors.darkTheme.surface : '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
      }}
    >
      <BottomSheetView
        style={{ paddingBottom: Math.max(insets.bottom, 24) }}
        className="px-5 pt-2"
      >
        {/* CREATE MODE */}
        {mode === 'CREATE' && (
          <CollectionCreateForm
            onSuccess={handleCreated}
            onCancel={handleClose}
          />
        )}

        {/* OPTIONS MODE */}
        {mode === 'OPTIONS' && collection && (
          <>
            {currentView === 'MENU' && (
              <CollectionMenuView
                collection={collection}
                onOpenEdit={() => setCurrentView('EDIT')}
                onOpenDelete={() => setCurrentView('DELETE')}
                onStudy={
                  onStudy
                    ? () => {
                        handleClose();
                        onStudy(collection);
                      }
                    : undefined
                }
              />
            )}

            {currentView === 'EDIT' && (
              <CollectionEditForm
                collection={collection}
                onSuccess={handleSaveEdit}
                onCancel={() => setCurrentView('MENU')}
              />
            )}

            {currentView === 'DELETE' && (
              <CollectionDeleteConfirm
                collection={collection}
                onSuccess={handleDeleteSuccess}
                onCancel={() => setCurrentView('MENU')}
              />
            )}
          </>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

export default CollectionOptionsBottomSheet;
