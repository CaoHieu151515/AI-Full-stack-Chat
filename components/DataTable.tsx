
import React from 'react';

interface DataTableProps {
  columns: string[];
  rows: (string | number)[][];
}

const DataTable: React.FC<DataTableProps> = ({ columns, rows }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                scope="col"
                className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-gray-900/50 divide-y divide-gray-700">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
