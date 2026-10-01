import type { AdminPlatform } from "../lib/api";

/* Olay filtrelerinde ortak platform seçimi. Platform bilgisi olaylara
   sonradan eklendi; "Tümü" eski (platformsuz) olayları da kapsar. */
export function AdminPlatformSelect({
  value,
  onChange,
}: {
  value: AdminPlatform;
  onChange: (value: AdminPlatform) => void;
}) {
  return (
    <label className="admin-field">
      <span>Platform</span>
      <select className="admin-input" value={value} onChange={(e) => onChange(e.target.value as AdminPlatform)}>
        <option value="">Tümü</option>
        <option value="web">Web</option>
        <option value="android">Android</option>
      </select>
    </label>
  );
}
