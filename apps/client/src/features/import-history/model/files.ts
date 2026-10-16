export function validateImportFiles(files: File[]) {
  if (!files.length) return "Select JSON files";
  if (files.length > 50) return "Select up to 50 files";
  if (files.some((file) => !file.name.toLowerCase().endsWith(".json")))
    return "Only JSON files are supported";
  if (files.some((file) => file.size > 20 * 1024 * 1024))
    return "Each file must be 20 MB or smaller";
  if (files.some((file) => file.size === 0)) return "Files must not be empty";
  return null;
}
