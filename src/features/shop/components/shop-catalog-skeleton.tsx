import { View } from 'react-native';
import { useSurface } from '@/components/ui';

export function ShopCatalogSkeleton({ label }: { label: string }) {
  const s = useSurface();
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityState={{ busy: true }} testID="shop-catalog-skeleton" className="flex-row flex-wrap justify-between">
      {[0, 1, 2, 3].map(index => (
        <View key={index} style={{ backgroundColor: s.surface, borderColor: s.border }} className="mb-4 w-[48%] gap-3 rounded-2xl border-2 border-b-4 p-3">
          <View style={{ backgroundColor: s.surfaceMuted }} className="h-24 rounded-xl" />
          <View style={{ backgroundColor: s.surfaceMuted }} className="h-5 w-3/4 rounded-md" />
          <View style={{ backgroundColor: s.surfaceMuted }} className="h-4 w-1/2 rounded-md" />
          <View style={{ backgroundColor: s.surfaceMuted }} className="mt-1 h-11 rounded-xl" />
        </View>
      ))}
    </View>
  );
}
