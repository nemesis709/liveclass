import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  PlannerDraftResponseModel,
  PlannerResponseModel,
  SavePlannerDraftRequestModel,
  SavePlannerRequestModel,
} from '../../model/planner';
import { plannerRepository } from '../../repository/planner';
import { queryKeys } from '../../shared/query';

export const usePlannerViewModel = (weekStart: string) => {
  const queryClient = useQueryClient();

  const plannerQuery = useQuery({
    queryKey: queryKeys.planner(weekStart),
    queryFn: () => plannerRepository.getPlanner(weekStart),
    enabled: weekStart.length > 0,
  });

  const plannerDraftQuery = useQuery({
    queryKey: queryKeys.plannerDraft(weekStart),
    queryFn: () => plannerRepository.getPlannerDraft(weekStart),
    enabled: weekStart.length > 0,
  });

  const savePlannerMutation = useMutation({
    mutationFn: (payload: SavePlannerRequestModel) =>
      plannerRepository.savePlanner(payload),
    onSuccess: async (planner: PlannerResponseModel) => {
      queryClient.setQueryData(queryKeys.planner(planner.weekStart), planner);
      queryClient.setQueryData(queryKeys.plannerDraft(planner.weekStart), null);
      await plannerRepository.deletePlannerDraft(planner.weekStart);
    },
  });

  const savePlannerDraftMutation = useMutation({
    mutationFn: (payload: SavePlannerDraftRequestModel) =>
      plannerRepository.savePlannerDraft(payload),
    onSuccess: (draft: PlannerDraftResponseModel) => {
      queryClient.setQueryData(queryKeys.plannerDraft(draft.weekStart), draft);
    },
  });

  return {
    plannerQuery,
    plannerDraftQuery,
    savePlannerMutation,
    savePlannerDraftMutation,
  };
};
