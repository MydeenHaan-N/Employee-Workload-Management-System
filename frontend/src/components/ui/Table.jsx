import React from 'react';

const Table = ({ columns, data, emptyMessage = 'No data available', onRowClick }) => {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-[rgba(58,44,30,0.18)] bg-white/40 p-10 text-center text-sm text-[#6b5a4f]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[24px] border border-[rgba(58,44,30,0.1)] bg-white/70">
      <table className="min-w-full">
        <thead className="bg-[rgba(244,239,231,0.8)]">
          <tr>
            {columns.map((column) => (
              <th
                key={column.header}
                className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#7d6c60]"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              className={`${onRowClick ? 'cursor-pointer' : ''} border-t border-[rgba(58,44,30,0.08)] transition hover:bg-white/75`}
            >
              {columns.map((column) => (
                <td key={column.header} className="px-5 py-4 align-top text-sm text-[#20150f]">
                  {column.render ? column.render(row) : row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
