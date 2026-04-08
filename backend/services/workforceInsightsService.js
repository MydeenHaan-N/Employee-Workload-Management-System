const ACTIVE_STATUSES = ['Pending', 'In Progress', 'Overdue'];
const PRIORITY_SCORE = { High: 3, Medium: 2, Low: 1 };

const normalizeSkills = (skills) => {
  if (Array.isArray(skills)) {
    return [...new Set(skills
      .map((skill) => String(skill || '').trim().toLowerCase())
      .filter(Boolean))];
  }

  if (typeof skills === 'string') {
    const trimmed = skills.trim();
    if (!trimmed) return [];

    try {
      return normalizeSkills(JSON.parse(trimmed));
    } catch {
      return normalizeSkills(trimmed.split(','));
    }
  }

  return [];
};

const serializeSkills = (skills) => JSON.stringify(normalizeSkills(skills));

const parseSkills = (value) => normalizeSkills(value);

const roundTo = (value, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
};

const getRemainingWeight = (assignment) => {
  const weight = assignment.task?.weight ?? assignment.weight ?? 1;
  const completion = Number(assignment.completionPercent || 0);
  return weight * (1 - (completion / 100));
};

const getDaysUntil = (dateLike) => {
  if (!dateLike) return null;
  const target = new Date(dateLike);
  const now = new Date();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
};

const getSkillMatch = (employeeSkills, requiredSkills) => {
  const normalizedEmployeeSkills = normalizeSkills(employeeSkills);
  const normalizedRequiredSkills = normalizeSkills(requiredSkills);

  if (normalizedRequiredSkills.length === 0) {
    return {
      ratio: 1,
      matchedSkills: [],
      missingSkills: [],
    };
  }

  const matchedSkills = normalizedRequiredSkills.filter((skill) => normalizedEmployeeSkills.includes(skill));
  return {
    ratio: matchedSkills.length / normalizedRequiredSkills.length,
    matchedSkills,
    missingSkills: normalizedRequiredSkills.filter((skill) => !matchedSkills.includes(skill)),
  };
};

const getBurnoutRisk = ({
  workloadScore,
  activeAssignments,
  overdueCount,
  urgentCount,
  stalledCount,
}) => {
  let points = 0;
  if (workloadScore >= 12) points += 3;
  else if (workloadScore >= 8) points += 2;
  else if (workloadScore >= 5) points += 1;

  if (activeAssignments >= 6) points += 2;
  else if (activeAssignments >= 4) points += 1;

  if (overdueCount >= 2) points += 2;
  else if (overdueCount === 1) points += 1;

  if (urgentCount >= 2) points += 1;
  if (stalledCount >= 2) points += 2;
  else if (stalledCount === 1) points += 1;

  if (points >= 7) return { level: 'Critical', score: points, colorTone: 'rose' };
  if (points >= 4) return { level: 'Watchlist', score: points, colorTone: 'amber' };
  return { level: 'Safe', score: points, colorTone: 'emerald' };
};

const buildPerformanceMetrics = (assignments = []) => {
  const completedAssignments = assignments.filter((assignment) => assignment.status === 'Completed');
  const onTimeCount = completedAssignments.filter((assignment) => {
    const deadline = assignment.task?.deadline;
    if (!deadline || !assignment.completedAt) return false;
    return new Date(assignment.completedAt) <= new Date(deadline);
  }).length;

  const avgDelayDays = completedAssignments.length === 0
    ? 0
    : completedAssignments.reduce((sum, assignment) => {
        const deadline = assignment.task?.deadline;
        if (!deadline || !assignment.completedAt) return sum;
        const delayMs = new Date(assignment.completedAt) - new Date(deadline);
        return sum + Math.max(0, delayMs / (1000 * 60 * 60 * 24));
      }, 0) / completedAssignments.length;

  const completionRate = assignments.length === 0 ? 0 : (completedAssignments.length / assignments.length) * 100;
  const onTimeRate = completedAssignments.length === 0 ? 0 : (onTimeCount / completedAssignments.length) * 100;
  const score = roundTo((completionRate * 0.55) + (onTimeRate * 0.45));

  return {
    totalAssignments: assignments.length,
    completedCount: completedAssignments.length,
    completionRate: roundTo(completionRate),
    onTimeRate: roundTo(onTimeRate),
    avgDelayDays: roundTo(avgDelayDays),
    score,
    trendLabel: score >= 80 ? 'Excellent' : score >= 60 ? 'Steady' : 'Needs Support',
  };
};

const buildEmployeeInsight = (employee, assignments = []) => {
  const activeAssignments = assignments.filter((assignment) => (
    assignment.isActive && ACTIVE_STATUSES.includes(assignment.status)
  ));

  const workloadScore = roundTo(activeAssignments.reduce((sum, assignment) => sum + getRemainingWeight(assignment), 0));
  const overdueCount = activeAssignments.filter((assignment) => assignment.status === 'Overdue').length;
  const urgentCount = activeAssignments.filter((assignment) => {
    const daysUntilDeadline = getDaysUntil(assignment.task?.deadline);
    return daysUntilDeadline !== null && daysUntilDeadline >= 0 && daysUntilDeadline <= 2;
  }).length;
  const stalledCount = activeAssignments.filter((assignment) => {
    const updatedAt = assignment.updatedAt || assignment.createdAt;
    const daysSinceUpdate = getDaysUntil(updatedAt);
    return daysSinceUpdate !== null && daysSinceUpdate < -3 && Number(assignment.completionPercent || 0) < 100;
  }).length;

  const burnoutRisk = getBurnoutRisk({
    workloadScore,
    activeAssignments: activeAssignments.length,
    overdueCount,
    urgentCount,
    stalledCount,
  });

  return {
    employeeId: employee.id,
    skills: parseSkills(employee.skills),
    workloadScore,
    activeAssignments: activeAssignments.length,
    overdueCount,
    urgentCount,
    stalledCount,
    burnoutRisk,
    performance: buildPerformanceMetrics(assignments),
  };
};

const buildRecommendation = ({ employee, insight, taskInput }) => {
  const skillMatch = getSkillMatch(employee.skills, taskInput.requiredSkills);
  const deadlineDays = getDaysUntil(taskInput.deadline);
  const urgencyBoost = deadlineDays !== null && deadlineDays <= 2 ? 10 : deadlineDays !== null && deadlineDays <= 5 ? 5 : 0;
  const capacityScore = Math.max(0, 100 - (insight.workloadScore * 7) - (insight.overdueCount * 8));
  const riskPenalty = insight.burnoutRisk.level === 'Critical' ? 18 : insight.burnoutRisk.level === 'Watchlist' ? 8 : 0;
  const score = roundTo(
    (skillMatch.ratio * 40)
    + (insight.performance.score * 0.35)
    + (capacityScore * 0.25)
    + urgencyBoost
    - riskPenalty
    - ((PRIORITY_SCORE[taskInput.priority] || 1) * 2)
  );

  const projectedLoad = roundTo(insight.workloadScore + Number(taskInput.weight || 1));
  const projectedRisk = getBurnoutRisk({
    workloadScore: projectedLoad,
    activeAssignments: insight.activeAssignments + 1,
    overdueCount: insight.overdueCount,
    urgentCount: insight.urgentCount + (deadlineDays !== null && deadlineDays <= 2 ? 1 : 0),
    stalledCount: insight.stalledCount,
  });

  const reasons = [
    skillMatch.matchedSkills.length > 0
      ? `Skill match on ${skillMatch.matchedSkills.join(', ')}`
      : skillMatch.missingSkills.length > 0
        ? `Needs support on ${skillMatch.missingSkills.join(', ')}`
        : 'No required skills constraint for this task',
    `Current workload score: ${insight.workloadScore}`,
    `Performance score: ${insight.performance.score}`,
    `Burnout risk: ${insight.burnoutRisk.level}`,
  ];

  return {
    employeeId: employee.id,
    fullName: employee.fullName,
    score,
    currentWorkload: insight.workloadScore,
    projectedWorkload: projectedLoad,
    currentRisk: insight.burnoutRisk.level,
    projectedRisk: projectedRisk.level,
    matchedSkills: skillMatch.matchedSkills,
    missingSkills: skillMatch.missingSkills,
    reasons,
  };
};

const rankEmployeesForTask = ({ employees = [], assignmentsByEmployee = {}, taskInput }) => {
  const normalizedTaskInput = {
    weight: Number(taskInput.weight || 1),
    priority: taskInput.priority || 'Medium',
    deadline: taskInput.deadline,
    requiredSkills: parseSkills(taskInput.requiredSkills),
  };

  return employees
    .map((employee) => {
      const normalizedEmployee = {
        ...employee,
        skills: parseSkills(employee.skills),
      };
      const insight = buildEmployeeInsight(normalizedEmployee, assignmentsByEmployee[employee.id] || []);
      return buildRecommendation({ employee: normalizedEmployee, insight, taskInput: normalizedTaskInput });
    })
    .sort((left, right) => right.score - left.score);
};

const buildEscalationAlerts = (assignments = []) => assignments.flatMap((assignment) => {
  const alerts = [];
  const task = assignment.task;
  const daysUntilDeadline = getDaysUntil(task?.deadline);
  const assigneeName = assignment.employee?.fullName || 'Employee';

  if (assignment.status === 'Overdue') {
    alerts.push({
      type: 'Overdue',
      severity: 'high',
      taskId: task?.id,
      assignmentId: assignment.id,
      employeeId: assignment.employeeId,
      message: `${assigneeName} has an overdue task: ${task?.title}`,
    });
  }

  if (assignment.status !== 'Completed' && daysUntilDeadline !== null && daysUntilDeadline >= 0 && daysUntilDeadline <= 2) {
    alerts.push({
      type: 'Deadline Risk',
      severity: daysUntilDeadline === 0 ? 'high' : 'medium',
      taskId: task?.id,
      assignmentId: assignment.id,
      employeeId: assignment.employeeId,
      message: `${task?.title} is due in ${daysUntilDeadline} day${daysUntilDeadline === 1 ? '' : 's'}`,
    });
  }

  const updatedAt = assignment.updatedAt || assignment.createdAt;
  const daysSinceUpdate = getDaysUntil(updatedAt);
  if (assignment.status !== 'Completed' && daysSinceUpdate !== null && daysSinceUpdate < -3 && Number(assignment.completionPercent || 0) < 100) {
    alerts.push({
      type: 'Stalled Progress',
      severity: 'medium',
      taskId: task?.id,
      assignmentId: assignment.id,
      employeeId: assignment.employeeId,
      message: `${task?.title} has not moved for ${Math.abs(daysSinceUpdate)} days`,
    });
  }

  return alerts;
});

const buildCompletionTrend = (assignments = []) => {
  const months = [];
  const now = new Date();
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months.push({
      key,
      label: date.toLocaleString('en-US', { month: 'short' }),
      completed: 0,
      created: 0,
    });
  }

  for (const assignment of assignments) {
    const createdKey = assignment.createdAt
      ? `${new Date(assignment.createdAt).getFullYear()}-${String(new Date(assignment.createdAt).getMonth() + 1).padStart(2, '0')}`
      : null;
    const completedKey = assignment.completedAt
      ? `${new Date(assignment.completedAt).getFullYear()}-${String(new Date(assignment.completedAt).getMonth() + 1).padStart(2, '0')}`
      : null;

    const createdBucket = months.find((item) => item.key === createdKey);
    if (createdBucket) createdBucket.created += 1;

    const completedBucket = months.find((item) => item.key === completedKey);
    if (completedBucket) completedBucket.completed += 1;
  }

  return months;
};

const buildManagerAnalytics = ({ teamInsights = [], assignments = [], tasks = [] }) => {
  const totalWorkloadScore = teamInsights.reduce((sum, insight) => sum + insight.workloadScore, 0);
  const highRiskCount = teamInsights.filter((insight) => insight.burnoutRisk.level === 'Critical').length;
  const watchlistCount = teamInsights.filter((insight) => insight.burnoutRisk.level === 'Watchlist').length;
  const averagePerformance = teamInsights.length === 0
    ? 0
    : roundTo(teamInsights.reduce((sum, insight) => sum + insight.performance.score, 0) / teamInsights.length);

  const priorityMix = tasks.reduce((acc, task) => {
    const key = task.priority || 'Medium';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, { High: 0, Medium: 0, Low: 0 });

  const skillCoverage = [...new Set(teamInsights.flatMap((insight) => insight.skills || []))];
  const topPerformer = [...teamInsights]
    .sort((left, right) => right.performance.score - left.performance.score)[0];

  return {
    totalWorkloadScore: roundTo(totalWorkloadScore),
    averagePerformance,
    highRiskCount,
    watchlistCount,
    priorityMix,
    skillCoverageCount: skillCoverage.length,
    topPerformer: topPerformer
      ? {
          employeeId: topPerformer.employeeId,
          score: topPerformer.performance.score,
        }
      : null,
    completionTrend: buildCompletionTrend(assignments),
  };
};

export {
  ACTIVE_STATUSES,
  buildEmployeeInsight,
  buildEscalationAlerts,
  buildManagerAnalytics,
  getDaysUntil,
  normalizeSkills,
  parseSkills,
  rankEmployeesForTask,
  serializeSkills,
};
