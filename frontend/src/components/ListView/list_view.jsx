import React, { useEffect, useState } from 'react';
import TaskCard from './taskcard/taskCard';
import FormComponent from '../form/From';
import { getcustomFields } from '../../helper/helper';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
 

const Listview = ({taskDetails,taskTypeCode,filtertasktype,parenntId,selectedTabId,selectedTabname}) => {
  const [tasks, setTasks] = useState([]);
  const [asctasks, ascsetTasks] = useState([]);
  const [descTasks, setdescTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false); // For toggling modal visibility
  const [availableCustomFields,setavailableCustomFields] = useState([]);
  const [taskToEdit, setTaskToEdit] = useState(null); // Task being edited
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("asc"); // Default sorting order is ascending
  const [pageSize, setPageSize] = useState(5);
  const [totalTasks, settotalTasks] = useState(0);
  const [totalPages, setTotalPages] = useState(0)
  const [filterList,setfilterList] = useState([]);
  const [appliedFilter, setappliedFilter] = useState("Filters");
  const [dropdownOptions, setDropdownOptions] = useState({});


  useEffect(()=>{
    sortOrder=='asc'?setTasks(asctasks):setTasks(descTasks)
  },[sortOrder])
  
  const handlePageSize = (e) => {
    setPageSize(parseInt(e.target.value, 10));
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchTasks();
  }, [pageSize, currentPage]); // Ensure it refetches on size/page change

  // Fetch tasks when taskTypeCode is set
  useEffect(() => {
    if (taskTypeCode) {
      fetchTasks();
    }
  }, [taskTypeCode, parenntId]); // Trigger on either variable change
  
  
  useEffect(() => {
    setCurrentPage(1);
    async function availableCustomFields() {
      const data = await getcustomFields(selectedTabId,setError,setLoading);
      setavailableCustomFields(data)
      const newFilterList = data.filter(filter =>
        filter['type'] == 'choice'
      )
      setfilterList(newFilterList)
    }
    availableCustomFields();
    fetchTasks()
    
  }, [selectedTabId]);

  const fetchcustomdropdownlist = async (table_name, column_name="*",condition='',listName) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_LOCAL_URL}/api/tasks/get_list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ table_name: table_name, column_name: column_name,condition:condition }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${table_name}: ${response.status}`);
      }
      const requestedList = await response.json();
      setDropdownOptions((prevalue)=>({
        ...prevalue,[listName]:requestedList
      }));
    } catch (error) {
      console.error(error);
      alert(`Error fetching ${table_name} list`);
    }
  };

  // Fetch function to call the API
  const fetchTasks = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_LOCAL_URL}/api/tasks/get_scope`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          { taskTypeCode : taskTypeCode,
            parent_task_id : parenntId,
            parent_ttype_id : taskDetails.task_type_id,
            selected_tab_id : selectedTabId,
            page_size : pageSize,
            page_number : currentPage
          }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status}`);
      }

      const {alltasks,total} = await response.json();
      settotalTasks(total);
      setTotalPages(Math.ceil(total / pageSize))
      
      const descfilteredTasks = alltasks.slice().reverse().filter(task => 
        selectedTabId == task.task_type_id &&
        (!parenntId || parenntId == task.parent_task_id || taskTypeCode == "all")
        );
      const ascfilteredTasks = alltasks.filter(task => 
        selectedTabId == task.task_type_id &&
        (!parenntId || parenntId == task.parent_task_id || taskTypeCode == "all")
        );

      
      ascsetTasks(ascfilteredTasks); // Update the tasks state with the response data
      setdescTasks(descfilteredTasks);
      sortOrder == 'asc'?setTasks(ascfilteredTasks):setTasks(descfilteredTasks);
      
    } catch (error) {
      setError(error.message); // Update error state in case of failure
    } finally {
      setLoading(false); // Set loading to false once the fetch is done
    }
  };

  const handleEditTask = (task) => {
    setTaskToEdit(task);
    setShowModal(true);
  };
  
  const handlePageJump = (e) => {
    setCurrentPage(parseInt(e.target.value, 10));
  };

  const handelfilter = async (e) => {
    const display_name_singular = e.target.value;
    const cf_id = e.target.options[e.target.selectedIndex].id;
    await setappliedFilter(display_name_singular);
    await fetchcustomdropdownlist('lookup', "*", "WHERE fk_custom_field_id=" + cf_id, display_name_singular);
  };

  // useEffect(()=>[

  // ])

  // Handle modal toggle
  const toggleModal = () => {
    setShowModal(!showModal);
    setTaskToEdit(false)
  };

  // Pagination handlers
  const nextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // console.log(dropdownOptions);
  
  return loading ? 
    (
    <div className='container d-flex justify-content-center'>
      <DotLottieReact
        src="https://lottie.host/fc278a4c-abe0-4e17-9c4b-d2e06ab3ce6e/FHHmq9VFBO.lottie"
        loop
        autoplay
      />
    </div>
    ):
    (
      <div>
        {/* Error message */}
        {error && <div className="alert alert-danger">{error}</div>}
        <button className="btn btn-primary mb-1" onClick={toggleModal}>Add {selectedTabname} +</button>
        

        <div id='list'>
          <div className="d-flex justify-content-between align-items-center">
            {/* Sorting Dropdown */}
            {totalPages > 0 && 
              <div className='d-flex justify-content-between align-items-center'>
                <div className="d-flex align-items-center me-2">
                  {/* <label className="me-2">Sort by:</label> */}
                  <select 
                    className="form-select w-auto" 
                    value={sortOrder} 
                    data-bs-toggle = "tooltip"
                    title='Sort Order'
                    onChange={(e) => setSortOrder(e.target.value)}
                    >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>

                  <select className="form-select w-auto ms-2" value={appliedFilter} onChange={handelfilter}>
                    {filterList.map((item, index) => (
                      <option key={index} value={item.display_name_singular} id={item.custom_field_id}>
                        {item.display_name_singular}
                      </option>
                    ))}
                  </select>
                  {appliedFilter != 'Filters' &&
                    <select className="form-select w-auto ms-2" value={appliedFilter} onChange={handelfilter}>
                      {dropdownOptions[appliedFilter].map((item, index) => (
                        <option key={index} value={item.option} id={item.lookup_id}>
                          {item.option}
                        </option>
                      ))}
                    </select>
                  }
                </div>

                <div className="d-flex align-items-center">
                  {/* <label className="me-2">Page Size</label> */}
                  <select 
                    className="form-select w-auto" 
                    value={pageSize} 
                    onChange={handlePageSize} 
                    data-bs-toggle = "tooltip"
                    title='Number of Records'
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                    <option value={totalTasks}>All</option>
                  </select>
                </div>
              </div>
            }

            {/* Pagination controls */}
            {totalPages > 0 &&
              <div className="d-flex justify-content-end align-items-center">
                <button
                  className="btn btn-outline-primary m-2"
                  onClick={prevPage}
                  data-bs-toggle = "tooltip"
                  title='Previous Page'
                  disabled={currentPage === 1}
                >
                  <i className="bi bi-arrow-left-circle"></i>
                </button>
                <span>{(currentPage - 1) * pageSize +1} - {pageSize * currentPage} of {totalTasks}</span>
                <select className="form-select w-auto ms-2" value={currentPage} onChange={handlePageJump}>
                  {[...Array(totalPages)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
                <button
                  className="btn btn-outline-primary m-2"
                  onClick={nextPage}
                  data-bs-toggle="tooltip"
                  title = 'Next Page'
                  disabled={currentPage == totalPages}
                >
                  <i className="bi bi-arrow-right-circle"></i>
                </button>
              </div>
            }
              
          </div>

          {/* Task list */}
          <div className="task-list">
            {tasks.length > 0 ? (
              <ul className="list-group">
                {tasks.map((task) => (
                  <TaskCard task={task} fetchTasks={fetchTasks} key={task.task_id} onEdit ={() => handleEditTask(task)}/>
                ))}
              </ul>
            ):null}
          </div>

          {/* Pagination controls */}
          {totalPages == 1 ? 
            null:
            <div className="d-flex justify-content-end align-items-center">
              <button
                className="btn btn-outline-primary m-2"
                onClick={prevPage}
                data-bs-toggle = "tooltip"
                title='Previous Page'
                disabled={currentPage === 1}
              >
                <i className="bi bi-arrow-left-circle"></i>
              </button>
              <span>{(currentPage - 1) * pageSize +1} - {pageSize * currentPage} of {totalTasks}</span>
              <select 
                className="form-select w-auto ms-2" 
                value={currentPage} 
                onChange={handlePageJump}>
                {[...Array(totalPages)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
              <button
                className="btn btn-outline-primary m-2"
                onClick={nextPage}
                data-bs-toggle="tooltip"
                title = 'Next Page'
                disabled={currentPage == totalPages}
              >
                <i className="bi bi-arrow-right-circle"></i>
              </button>
            </div>
           }

          {/* Modal for adding a new task */}
          {showModal && 
            (<FormComponent 
              toggleModal={toggleModal} 
              refreshTasks={fetchTasks} 
              parent_task_id={parenntId} 
              selectedTabId={selectedTabId} 
              selectedTabName={selectedTabname} 
              availableCustomFields={availableCustomFields} 
              taskToEdit={taskToEdit} 
              totalPages={totalPages} 
              setSortOrder={setSortOrder} 
              setCurrentPage={setCurrentPage} 
              />)}
        </div>
      </div>
    );
};

export default Listview;
