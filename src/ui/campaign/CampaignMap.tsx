import { useEffect } from 'react';
import { loadCampaign } from '../../game/campaign/CampaignDirector';
import { RESCUE_VANGUARD_CAMPAIGN_ID } from '../../data/campaigns/campaignDefinitions';
import { CampaignMapPolished } from './CampaignMapPolished';

export const CampaignMap = () => {
  useEffect(() => {
    loadCampaign(RESCUE_VANGUARD_CAMPAIGN_ID);
  }, []);
  return <CampaignMapPolished />;
};
