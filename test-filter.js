const initialData = [
  {
    name: "Ayyan zubair",
    breakdown: [
      { testDate: null, total: 20 },
      { testDate: null, total: 20 },
      { testDate: "2026-09-14T00:00:00.000Z", total: 24 },
      { testDate: "2026-09-21T00:00:00.000Z", total: 20 }
    ]
  }
];

const selectedMonthFilter = "September 2026";

const filteredStudents = initialData.map(student => {
  const filteredBreakdown = student.breakdown.filter(b => {
    if (!b.testDate) return false;
    const d = new Date(b.testDate);
    if (isNaN(d.getTime())) return false;
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) === selectedMonthFilter;
  });
  
  let newTotal = 0;
  filteredBreakdown.forEach(b => newTotal += b.total);
  
  return { ...student, total: newTotal, filteredBreakdown };
}).filter(s => s.breakdown.length > 0);

console.log(JSON.stringify(filteredStudents, null, 2));
