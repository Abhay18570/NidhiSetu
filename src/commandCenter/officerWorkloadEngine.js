/**
 * NidhiSetu Command Center — Officer Workload & Assignment Engine
 * Analyzes case distribution, scrutiny backlogs, assignment mapping, and completion duration metrics.
 *
 * CRITICAL REQUIREMENTS:
 * - Does not calculate performance metrics from missing timestamps.
 * - Explicitly tracks unassigned tasks and high-priority backlogs.
 * - Records full audit history for assignments and reassignments.
 */

import { officerAssignmentRepository, userRepository } from '../storage';
import { aggregateActionInbox } from './unifiedCaseAggregator';
import { RISK_PRIORITY } from './commandCenterModel';

/**
 * Computes workload distribution across all authorized officers.
 *
 * @returns {Promise<Object>} Officer workload telemetry and assignments
 */
export async function computeOfficerWorkload() {
  const [inboxItems, allAssignments, allUsers] = await Promise.all([
    aggregateActionInbox(),
    officerAssignmentRepository.getAllAssignments(),
    userRepository.getAllUsers ? userRepository.getAllUsers() : [],
  ]);

  const officers = allUsers.filter((u) => u.role === 'officer' || u.role === 'admin');

  // Map assignments to inbox items
  const assignmentMap = new Map(allAssignments.map((a) => [a.actionId, a]));

  // Augment inbox items with persisted assignments if available
  const enrichedInbox = inboxItems.map((item) => {
    const persisted = assignmentMap.get(item.actionId);
    return {
      ...item,
      assignedOfficerId: persisted ? persisted.assignedTo : item.assignedOfficerId,
      assignedBy: persisted ? persisted.assignedBy : null,
      assignedAt: persisted ? persisted.assignedAt : null,
      assignmentHistory: persisted ? persisted.history : [],
    };
  });

  const now = new Date();

  // Officer metrics map
  const workloadByOfficer = new Map();

  // Initialize for all known officers
  officers.forEach((off) => {
    const offId = String(off.id || off.userId);
    workloadByOfficer.set(offId, {
      officerId: offId,
      officerName: off.fullName || off.name || off.email,
      officerEmail: off.email,
      role: off.role,
      openTasksCount: 0,
      highPriorityTasksCount: 0,
      overdueTasksCount: 0,
      assignedTaskIds: [],
      tasks: [],
    });
  });

  let unassignedCount = 0;
  const unassignedTasks = [];

  enrichedInbox.forEach((task) => {
    const assignedId = task.assignedOfficerId ? String(task.assignedOfficerId) : null;
    const isHighPriority = task.priority === RISK_PRIORITY.HIGH || task.priority === RISK_PRIORITY.CRITICAL;
    const isOverdue = task.dueDate ? new Date(task.dueDate) < now : false;

    if (!assignedId || !workloadByOfficer.has(assignedId)) {
      unassignedCount++;
      unassignedTasks.push(task);
      return;
    }

    const stats = workloadByOfficer.get(assignedId);
    stats.openTasksCount++;
    if (isHighPriority) stats.highPriorityTasksCount++;
    if (isOverdue) stats.overdueTasksCount++;
    stats.assignedTaskIds.push(task.actionId);
    stats.tasks.push(task);
  });

  const officerStats = Array.from(workloadByOfficer.values()).sort(
    (a, b) => b.openTasksCount - a.openTasksCount
  );

  return {
    officerStats,
    totalOfficers: officers.length,
    totalOpenTasks: enrichedInbox.length,
    totalUnassignedTasks: unassignedCount,
    unassignedTasks,
    allTasksWithAssignments: enrichedInbox,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Assigns or reassigns an action item to an officer.
 */
export async function assignOfficerTask({
  actionId,
  sourceModule,
  sourceEntityId,
  institutionId,
  assignedTo,
  assignedBy,
  reason,
  previousAssignee,
}) {
  return await officerAssignmentRepository.assignTask({
    actionId,
    sourceModule,
    sourceEntityId,
    institutionId,
    assignedTo,
    assignedBy,
    reason,
    previousAssignee,
  });
}
