import type { PlannerDraftBlockModel } from '../../model/planner';

export const isSameDayBlock = (
  left: PlannerDraftBlockModel,
  right: PlannerDraftBlockModel,
): boolean => left.dayOfWeek === right.dayOfWeek;

export const isOverlappingBlock = (
  left: PlannerDraftBlockModel,
  right: PlannerDraftBlockModel,
): boolean => {
  if (!isSameDayBlock(left, right)) {
    return false;
  }

  return left.startMinutes < right.endMinutes && right.startMinutes < left.endMinutes;
};

export const findConflictingBlockIds = (
  targetBlock: PlannerDraftBlockModel,
  blocks: PlannerDraftBlockModel[],
): string[] =>
  blocks
    .filter((block) => block.id !== targetBlock.id)
    .filter((block) => isOverlappingBlock(targetBlock, block))
    .map((block) => block.id);

export const hasConflictingBlocks = (
  blocks: PlannerDraftBlockModel[],
): boolean =>
  blocks.some((block) => findConflictingBlockIds(block, blocks).length > 0);

export const getConflictingBlockIdsByBlockId = (
  blockId: string,
  blocks: PlannerDraftBlockModel[],
): string[] => {
  const targetBlock = blocks.find((block) => block.id === blockId);

  if (!targetBlock) {
    return [];
  }

  return findConflictingBlockIds(targetBlock, blocks);
};
