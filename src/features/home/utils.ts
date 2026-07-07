export function formatNumber(n: number): string {
  let result = '';
  const str = n.toString();

  let count = 0;

  for (let i = str.length - 1; i >= 0; i--) {
    result = str[i] + result;
    count++;
    if (count === 3) {
      result = `,${result}`;
      count = 0;
    }
  }

  return result.startsWith(',') ? result.slice(1) : result;
}

export function getGreetingKey() {
  const hour = new Date().getHours();
  if (hour < 12)
    return 'home.good_morning' as const;
  if (hour < 18)
    return 'home.good_afternoon' as const;
  return 'home.good_evening' as const;
}
