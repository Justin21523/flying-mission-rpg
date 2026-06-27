import { useEnvironmentPropSetStore } from '../../stores/useEnvironmentEditorStore';

export function getEnvironmentPropSets(propSetIds: string[]) {
  const sets = useEnvironmentPropSetStore.getState().items;
  return propSetIds.map((id) => sets.find((set) => set.id === id)).filter((set) => !!set);
}
