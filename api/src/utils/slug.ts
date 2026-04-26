export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function generateUniqueSlug(base: string, suffix?: string): string {
  const slug = slugify(base);
  return suffix ? `${slug}-${suffix}` : slug;
}
