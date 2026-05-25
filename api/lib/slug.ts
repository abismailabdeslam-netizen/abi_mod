export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")  // Remove special chars
    .replace(/\s+/g, "-");          // Replace spaces with dashes
}
