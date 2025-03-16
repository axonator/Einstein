import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import AddBoxRoundedIcon from '@mui/icons-material/AddBoxRounded';
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CampaignForm from './form/CampaignForm';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, flexRender } from "@tanstack/react-table";

export default function Campaigns() {
    const navigate = useNavigate(); // Hook to change URL
    const [tableData, setTableData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [showAddForm, setShowAddForm] = React.useState(false);

    const toggleModal = () => {
        setShowAddForm(!showAddForm);
      };
    

    // async function addCampaign() {
    //     toggleModal();
    // }

    useEffect(()=>{
        getCampaigns();
    },[])

    async function getCampaigns() {
        try {
            let url = `${import.meta.env.VITE_LOCAL_URL}/api/common/get_list`;
            const requestBody = { table_name: 'campaign', column_name: '*', condition: ""};

            const response = await axios.post(url, requestBody);
            setTableData(response.data);
            console.log(response.data);
            

            if (response.data.length > 0) {
                // Dynamically generate columns based on API response keys
                const dynamicColumns = Object.keys(response.data[0])
                    .filter((key) => key !== "raw_body") // Exclude raw_body
                    .map((key) => ({
                        accessorKey: key,
                        header: key.replace(/_/g, " ").toUpperCase(),
                    }));
                setColumns(dynamicColumns);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

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
            {
                showAddForm && 
                <CampaignForm toggleModal={toggleModal} refreshTasks={getCampaigns}/>
            }
            <Tooltip title = "Add Campaign">
                <IconButton size='small' className='ms-1' onClick={toggleModal}>
                    <AddBoxRoundedIcon/>
                </IconButton>
            </Tooltip>
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
                        onClick={() => {navigate(`/emails/${row.original.id}`)}}
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
