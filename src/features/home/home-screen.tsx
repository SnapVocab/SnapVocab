import { FocusAwareStatusBar, SafeAreaView, ScrollView } from '@/components/ui';
import { HomeSearchBar } from './components';

export function HomeScreen() {
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <HomeSearchBar />
      </ScrollView>
    </SafeAreaView>
  );
}

export default HomeScreen;
