const cyrillicToLatinMap: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'j', 'з': 'z',
  'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
  'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'x', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sh',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  'ў': 'o', 'қ': 'q', 'ғ': 'g', 'ҳ': 'h'
};

export function generateSlug(name: string): string {
  if (!name) return 'untitled';

  const latinName = name
    .toLowerCase()
    .split('')
    .map(char => cyrillicToLatinMap[char] || char)
    .join('');

  return latinName
    .replace(/['`’]/g, '')           // apostrof
    .replace(/[^a-z0-9\s-]/g, '')    // maxsus belgilar
    .replace(/\s+/g, '-')            // bo'shliq → tire
    .replace(/-+/g, '-')             // ko'p tire → bitta
    .replace(/^-|-$/g, '')           // bosh/oxir tire
    || 'untitled';
}
