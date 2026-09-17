import { useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import { FocusAwareStatusBar, SafeAreaView } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { CollectionDetailHeader } from './components';

export function CollectionDetailScreen() {
  const {
    name: paramName,
    translation: paramTranslation,
    type: paramType,
  } = useLocalSearchParams<{
    id: string;
    name?: string;
    translation?: string;
    type?: string;
  }>();

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />

      {/* Header */}
      <CollectionDetailHeader
        title={paramName || translate('learn.collection_detail.title')}
        subtitle={paramTranslation || translate('learn.collection_detail.subtitle')}
        showOptions={paramType === 'USER'}
      />

      <View className="flex-1 p-4" />
    </SafeAreaView>
  );
}

export default CollectionDetailScreen;
