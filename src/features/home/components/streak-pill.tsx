import { FlameIcon } from '@/components/ui/icons/flame';
import { Pill } from '@/components/ui/pill';

export function StreakPill({ streak }: { streak: number }) {
  return (
    <Pill
      icon={FlameIcon}
      iconFill="#EA580C"
      label={String(streak)}
      className="border border-[#FED7AA] bg-[#FFEDD5]"
      textClassName="text-[#EA580C]"
    />
  );
}
