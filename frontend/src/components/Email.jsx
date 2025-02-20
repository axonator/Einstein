import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, flexRender } from "@tanstack/react-table";

export default function Email() {
    const { campaignId } = useParams(); // Get campaignId from URL
    const navigate = useNavigate(); // Hook to change URL
    const [tableData, setTableData] = useState([]);
    const [columns, setColumns] = useState([]);

    async function getContacts() {
        try {
            let url = `${import.meta.env.VITE_LOCAL_URL}/api/tasks/get_list`;
            let requestBody = {};

            if (campaignId) {
                // Fetch schedule table where fk_campaign_id = campaignId
                requestBody = { table_name: 'schedule', column_name: '*', condition: `WHERE fk_campaign_id=${campaignId}` };
            } else {
                // Fetch campaign table when no campaignId is selected
                requestBody = { table_name: 'campaign', column_name: '*', condition: "" };
            }

            const response = await axios.post(url, requestBody);
            setTableData(response.data);

            if (response.data.length > 0) {
                // Dynamically generate columns based on API response keys
                const dynamicColumns = Object.keys(response.data[0]).map((key) => ({
                    accessorKey: key,
                    header: key.replace(/_/g, " ").toUpperCase(),
                }));
                setColumns(dynamicColumns);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    useEffect(() => {
        getContacts();
    }, [campaignId]); // Refetch data when campaignId changes

    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 });
    const [sorting, setSorting] = useState([]);

    const table = useReactTable({
        data: tableData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: { pagination, sorting },
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
    });

    return (
        <div className="container mx-auto mt-5">
            <h1 className="text-2xl font-bold mb-4">{campaignId ? `Schedule for Campaign ${campaignId}` : "Campaigns"}</h1>
            <table className="table-auto w-full border-collapse border border-gray-300">
                <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id} className="bg-gray-200">
                            {headerGroup.headers.map((header) => (
                                <th
                                    key={header.id}
                                    className="p-2 border cursor-pointer"
                                    onClick={header.column.getToggleSortingHandler()}
                                >
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                    {header.column.getIsSorted() ? (header.column.getIsSorted() === "desc" ? " 🔽" : " 🔼") : ""}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody className="text-center">
                    {table.getRowModel().rows.map((row) => (
                        <tr
                        key={row.id}
                        className="hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                            if (!campaignId) {
                                navigate(`/emails/${row.original.id}`); // Change URL when clicking on a campaign
                            }
                        }}
                        >
                            {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id} className="p-2 border">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                // <a href={row.data}>
                                // </a>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="flex justify-between mt-2">
                <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="px-3 py-1 rounded"
                >
                    Previous
                </button>
                <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="px-3 py-1 rounded"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
