import type { BottomSheetBackdropProps, BottomSheetModal } from '@gorhom/bottom-sheet';
import type { Collection, CollectionRef } from '../../types';
import { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUniwind } from 'uniwind';
import { AppBottomSheetModal } from '@/components/ui/app-bottom-sheet-modal';
import colors from '@/components/ui/colors';
import { CollectionCreateForm } from './collection-create-form';
import { CollectionDeleteConfirm } from './collection-delete-confirm';
import { CollectionEditForm } from './collection-edit-form';
import { CollectionMenuView } from './collection-menu-view';

type Props = {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  collection: CollectionRef | null;
  mode?: 'OPTIONS' | 'CREATE';
  onCreated?: (collection: Collection) => void;
  onSaveEdit?: (collection: Collection) => void;
  onDelete?: (collection: CollectionRef) => void;
  onStudy?: (collection: CollectionRef) => void;
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
  const router = useRouter();
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
    <AppBottomSheetModal
      ref={bottomSheetRef}
      stackBehavior="replace"
      enableDynamicSizing={mode !== 'CREATE' && currentView !== 'EDIT'}
      snapPoints={mode === 'CREATE' || currentView === 'EDIT' ? ['75%'] : undefined}
      topInset={insets.top}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      enableBlurKeyboardOnGesture
      // Android edge-to-edge does not consistently resize the window for the IME.
      // Let the sheet offset itself by the keyboard height instead.
      android_keyboardInputMode="adjustPan"
      backdropComponent={renderBackdrop}
      onDismiss={handleDismiss}
      handleIndicatorStyle={{ backgroundColor: isDark ? colors.darkTheme.border : '#CBD5E1', width: 36, height: 4 }}
      backgroundStyle={{
        backgroundColor: isDark ? colors.darkTheme.surface : '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
      }}
    >
      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 24) }}
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
                onStudySettings={() => {
                  handleClose();
                  router.push({ pathname: '/collections/study-settings', params: { collectionId: String(collection.id), name: collection.name } });
                }}
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
      </BottomSheetScrollView>
    </AppBottomSheetModal>
  );
}

export default CollectionOptionsBottomSheet;
