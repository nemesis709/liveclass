import type {
  PlannerDraftResponseModel,
  PlannerResponseModel,
  SavePlannerDraftRequestModel,
  SavePlannerRequestModel,
} from '../../model/planner';

export interface PlannerRepository {
  getPlanner(weekStart: string): Promise<PlannerResponseModel>;
  savePlanner(payload: SavePlannerRequestModel): Promise<PlannerResponseModel>;
  getPlannerDraft(weekStart: string): Promise<PlannerDraftResponseModel | null>;
  savePlannerDraft(
    payload: SavePlannerDraftRequestModel,
  ): Promise<PlannerDraftResponseModel>;
  deletePlannerDraft(weekStart: string): Promise<void>;
}

export type PlannerRepositoryType = PlannerRepository;
