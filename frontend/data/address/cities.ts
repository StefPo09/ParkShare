import { cityGroups as generatedCityGroups } from './generatedCities';

export const cityGroups = {
  ...generatedCityGroups,
  Romania: [...new Set([...(generatedCityGroups.Romania ?? []), 'Brașov'])],
};
