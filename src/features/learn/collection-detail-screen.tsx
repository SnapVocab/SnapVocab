import * as React from 'react';
import { View } from 'react-native';
import { FocusAwareStatusBar, SafeAreaView } from '@/components/ui';
import { CollectionOptionsBottomSheet } from './components';
import {
  CollectionBreadcrumbBar,
  CollectionDetailContent,
  CollectionDetailFAB,
  CollectionDetailHeader,
  TopicItemOptionsBottomSheet,
  TopicItemPreviewModal,
} from './components/collection-detail';
import { useCollectionDetail } from './use-collection-detail';

export function CollectionDetailScreen() {
  const detail = useCollectionDetail();

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />

      <View className="flex-1">
        {/* Header with back navigation & collection options menu */}
        <CollectionDetailHeader
          title={detail.headerTitle}
          subtitle={detail.headerSubtitle}
          onBackPress={detail.handleBack}
          onOptionsPress={detail.handleOptionsPress}
          showOptions={!!detail.collectionData}
        />

        {/* Breadcrumbs for deep topic hierarchy */}
        <CollectionBreadcrumbBar
          parentStack={detail.parentStack}
          rootName={detail.collectionTitle}
          onBreadcrumbPress={detail.handleBreadcrumbPress}
        />

        {/* Virtualized Hybrid FlashList content (Subtopics + Words / Topics) */}
        <CollectionDetailContent detail={detail} />
      </View>

      {/* Floating Speed Dial to add Words or Topics/Subtopics */}
      {/* System collections are read-only: the server refuses new topics and words there. */}
      {detail.isUserCollection && (
        <CollectionDetailFAB
          collectionId={String(detail.id)}
          collectionName={detail.collectionTitle}
          currentParentId={detail.currentParentId}
          currentParentName={detail.currentParent?.name}
          firstTopicId={detail.firstTopicId}
          firstTopicName={detail.firstTopicName}
        />
      )}

      {/* Collection Options (Edit / Delete) Bottom Sheet Modal */}
      <CollectionOptionsBottomSheet
        bottomSheetRef={detail.bottomSheetRef}
        collection={detail.collectionData}
        onDelete={detail.handleDeleteSuccess}
      />

      {/* Word / Topic Item Flashcard Preview Modal */}
      <TopicItemPreviewModal
        bottomSheetRef={detail.previewBottomSheetRef}
        item={detail.previewItem}
        items={detail.filteredItems}
        currentIndex={detail.previewIndex}
        template={detail.activeTemplate}
        schema={detail.topicSchema || detail.fullSchema}
        hasPrev={detail.previewIndex > 0}
        hasNext={detail.previewIndex < detail.filteredItems.length - 1}
        onPrev={detail.handlePrevPreview}
        onNext={detail.handleNextPreview}
      />

      <TopicItemOptionsBottomSheet
        bottomSheetRef={detail.itemOptionsBottomSheetRef}
        item={detail.selectedItem}
        topicId={detail.currentParentId}
        onEdit={detail.handleEditTopicItem}
      />
    </SafeAreaView>
  );
}
