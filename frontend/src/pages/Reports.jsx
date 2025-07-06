import { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Header from './Header';

function Reports() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportedDeptFilter, setReportedDeptFilter] = useState('');
  const [requiredDeptFilter, setRequiredDeptFilter] = useState('');

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');

    axios.get('https://issue-tracker-lppf.onrender.com/api/v1/fetch-report', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      withCredentials: true,
    })
    .then((response) => {
      setTasks(response.data.data);
      setFilteredTasks(response.data.data);
    })
    .catch((error) => {
      console.log(error);
    });
  }, []);

  const parseDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return null;

    const [datePart, timePart] = dateTimeStr.split(' ');
    const [day, month, year] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    return new Date(year, month - 1, day, hours, minutes, seconds);
  };

  const filterByDate = () => {
    const start = startDate ? new Date(startDate).getTime() : null;
    const end = endDate ? new Date(endDate).getTime() : null;

    const filtered = tasks.filter((task) => {
      const createdAt = parseDateTime(task.created_at)?.getTime();

      const matchesDate = createdAt &&
        (start ? createdAt >= start : true) &&
        (end ? createdAt <= end : true);
      const matchesReportedDept = reportedDeptFilter ? task.user_department_name === reportedDeptFilter : true;
      const matchesRequiredDept = requiredDeptFilter ? task.required_department_name === requiredDeptFilter : true;

      return matchesDate && matchesReportedDept && matchesRequiredDept;
    });

    setFilteredTasks(filtered);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredTasks.map(task => ({
      Problem: task.issue,
      Description: task.description || 'None',
      Address: task.address,
      Completed: task.complete ? 'Yes' : 'No',
      "Department Reported": task.user_department_name || '-',
      "Required Department": task.required_department_name,
      "Acknowledge Time": task.acknowledge_at || '-',
      "Created Time": task.created_at,
      "Resolved Time": task.updated_at && task.updated_at !== task.created_at ? task.updated_at : '-'
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks Report");

    XLSX.writeFile(workbook, "Tasks_Report.xlsx");
  };

  const formatDateInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Header />

        <main className="px-4 sm:px-6 lg:px-8 py-6 flex-grow">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-indigo-700 text-center mb-8">Problems Report</h2>

            {/* Filters */}
            <div className="bg-white p-6 rounded-md shadow-md mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="dd-mm-yyyy"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="dd-mm-yyyy"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reported Department</label>
                  <select
                    value={reportedDeptFilter}
                    onChange={(e) => setReportedDeptFilter(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Reported Depts</option>
                    {[...new Set(tasks.map((task) => task.user_department_name).filter(Boolean))].map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Required Department</label>
                  <select
                    value={requiredDeptFilter}
                    onChange={(e) => setRequiredDeptFilter(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Required Depts</option>
                    {[...new Set(tasks.map((task) => task.required_department_name))].map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={filterByDate}
                  className="h-10 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                >
                  Filter
                </button>

                <button
                  onClick={exportToExcel}
                  className="h-10 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                >
                  Export to Excel
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="shadow overflow-hidden border-b border-gray-200 rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-indigo-600">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Problem</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Description</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Address</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Completed</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Department Reported</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Required Department</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Acknowledge Time</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Created Time</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Resolved Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTasks && filteredTasks.length > 0 ? (
                      filteredTasks.map((task) => (
                        <tr key={task.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{task.issue}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{task.description || 'None'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{task.address}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${task.complete ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {task.complete ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{task.user_department_name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{task.required_department_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{task.acknowledge_at || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{task.created_at}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {task.complete === 1 ? task.updated_at : "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="px-4 py-6 text-center text-sm text-gray-500">
                          No issues found matching the filter criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default Reports;
