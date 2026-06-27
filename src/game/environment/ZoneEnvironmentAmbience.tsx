import { WorldSkyAmbience } from '../flight/world/WorldSkyAmbience';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { useEditorZoneSegmentStore } from '../../stores/game/editorZoneSegmentStore';
import { useEditorMissionZoneStore } from '../../stores/game/editorMissionZoneStore';
import { useEnvironmentThemeStore } from '../../stores/useEnvironmentEditorStore';
import { themeToAmbience } from './applyEnvironmentTheme';

// Batch J/K — play-mode landing ambience driven by the active segment's environmentThemeId, falling back to
// the active zone's default environmentThemeId (Batch K). Reactive on the zone/segment/theme stores so editing
// a theme in Edit Mode updates the sky live (Edit/Play parity: the same editable theme also writes the ground
// override via applySegmentEnvironment). Falls back to the default daytime gradient when neither is set.
const DEFAULT = { top: '#4a90d9', bottom: '#d6ecff' } as const;

export const ZoneEnvironmentAmbience = () => {
  const segId = useAdvancedMissionZoneStore((s) => s.activeSegmentId);
  const zoneId = useAdvancedMissionZoneStore((s) => s.activeZoneId);
  const segments = useEditorZoneSegmentStore((s) => s.items);
  const zones = useEditorMissionZoneStore((s) => s.items);
  const themes = useEnvironmentThemeStore((s) => s.items);

  const seg = segId ? segments.find((x) => x.id === segId) : undefined;
  const zone = zoneId ? zones.find((z) => z.id === zoneId) : undefined;
  const themeId = seg?.environmentThemeId ?? zone?.environmentThemeId;
  const theme = themeId ? themes.find((t) => t.id === themeId) : undefined;
  if (!theme) return <WorldSkyAmbience top={DEFAULT.top} bottom={DEFAULT.bottom} />;

  const a = themeToAmbience(theme);
  return <WorldSkyAmbience top={a.top} bottom={a.bottom} fog={a.fog} fogNear={a.fogNear} fogFar={a.fogFar} ambient={a.ambient} sun={a.sun} />;
};
