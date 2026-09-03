export function analytics(complaints) {
  const group = (key) => complaints.reduce((acc, c) => {
    const value = c[key] || "Unassigned";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

  return {
    totals: {
      complaints: complaints.length,
      highPriority: complaints.filter((c) => c.severity === "high").length,
      overdue: complaints.filter((c) => ["submitted", "under_review"].includes(c.status) && Date.now() - new Date(c.createdAt).getTime() > 7 * 24 * 60 * 60 * 1000).length
    },
    byCategory: group("category"),
    byDistrict: group("district"),
    byStatus: group("status"),
    byPriority: group("severity"),
    resolutionTrend: [5, 4.7, 4.2, 4.4, 3.9, 4.1]
  };
}
