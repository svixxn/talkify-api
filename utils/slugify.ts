export function slugify(name: string) {
  return name.replace(" ", "-").toLowerCase();
}
