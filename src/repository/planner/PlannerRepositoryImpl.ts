import type {
  PlannerDraftResponseModel,
  PlannerResponseModel,
  SavePlannerDraftRequestModel,
  SavePlannerRequestModel,
} from '../../model/planner';
import { apiClient } from '../../shared/api';
import type { PlannerRepositoryType } from './PlannerRepository';

export const plannerRepository: PlannerRepositoryType = {
  async getPlanner(weekStart: string): Promise<PlannerResponseModel> {
    const { data } = await apiClient.get<PlannerResponseModel>('/planner', {
      params: { weekStart },
    });
    return data;
  },

  async savePlanner(
    payload: SavePlannerRequestModel,
  ): Promise<PlannerResponseModel> {
    const { data } = await apiClient.put<PlannerResponseModel>(
      '/planner',
      payload,
    );
    return data;
  },

  async getPlannerDraft(
    weekStart: string,
  ): Promise<PlannerDraftResponseModel | null> {
    const { data } = await apiClient.get<PlannerDraftResponseModel>(
      '/planner/draft',
      {
        params: { weekStart },
      },
    );

    if (data.blocks.length === 0) {
      return null;
    }

    return data;
  },

  async savePlannerDraft(
    payload: SavePlannerDraftRequestModel,
  ): Promise<PlannerDraftResponseModel> {
    const { data } = await apiClient.put<PlannerDraftResponseModel>(
      '/planner/draft',
      payload,
    );
    return data;
  },

  async deletePlannerDraft(weekStart: string): Promise<void> {
    await apiClient.delete('/planner/draft', {
      params: { weekStart },
    });
  },
};
