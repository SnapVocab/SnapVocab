import type { PressableProps } from 'react-native';
import { Button } from '@/components/ui';
import { EditIcon } from '@/components/ui/icons';

export function EditButton({ onPress }: Pick<PressableProps, 'onPress'>) {
  return (
    <Button variant="ghost" size="icon" className="size-11 rounded-full bg-gray-100" onPress={onPress}>
      <EditIcon />
    </Button>
  );
}
