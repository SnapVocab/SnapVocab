import { Button } from '@/components/ui';
import { SettingsIcon } from '@/components/ui/icons';

export function SettingsButton() {
  return (
    <Button variant="ghost" size="icon" className="size-11 rounded-full bg-gray-100">
      <SettingsIcon />
    </Button>
  );
}
