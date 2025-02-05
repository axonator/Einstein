import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Detailed_View from './DetailView/detailed_view';
import AiDocument from './AiDocument/AiDocument';
import Tabs from './tabs/Tabs';
import Listview from './ListView/list_view';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const SingleView = () => {
  const [taskTypeCode, setTaskTypeCode] = useState('root');
  const [tabsData, setTabsData] = useState([]);
  const [taskId, setTaskId] = useState(1);
  const [taskDetails, setTaskDetails] = useState({});
  const [CustomDetails, setCustomDetails] = useState({});
  const [detailedtaskToEdit, setDetailedTaskToEdit] = useState(null); // Task being edited
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const location = useLocation();

  // Set taskTypeCode from the query parameter
  useEffect(() => {
    const taskTypeCodeFromQuery = getid('scope'); // 'scope' query param is expected
    const taskidFromQuery = getid('pid'); // 'task' query param is expected

    if (taskTypeCodeFromQuery) {
      setTaskTypeCode(taskTypeCodeFromQuery);
    }

    if (taskidFromQuery) {
      setTaskId(taskidFromQuery); // Update taskId
    }
  }, [location.search]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await getTaskDetails();
      setIsLoading(false);
    };
    fetchData();
  }, [taskId, taskTypeCode]);

  useEffect(()=>{
    const fetchData = async () => {
      setIsLoading(true);
      Object.keys(taskDetails).length ? await fetchtabs():null
      setIsLoading(false);
    };
    fetchData();
  },[taskDetails])

  async function getTaskDetails() {
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/tasks/${taskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task_id: taskId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status}`);
      }
      
      const data = await response.json();
      const customFields = data.customFields;
      const defaultFields = data.taskDetails;

      setTaskDetails(defaultFields);
      setCustomDetails(customFields);
      setDetailedTaskToEdit(data);
    } catch (error) {
      console.error(error.message);
    }
  }

  // Fetch function to call the API
  async function fetchtabs() {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/tasks/get_tabs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ display_name_singular: taskTypeCode }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status}`);
      }

      const data = await response.json();
      const display_name_plural = data.display_name_plural;
      const display_name_singular = data.display_name_singular;
      const tabIds = data.tabsid;

      const transformedData = display_name_plural.map((plural_name, idx) => ({
        label: plural_name,
        content: (
          <Listview
            taskDetails = {taskDetails}
            taskTypeCode={taskTypeCode}
            filtertasktype={plural_name}
            parenntId={taskId}
            selectedTabId={tabIds[idx]}
            selectedTabname={display_name_singular[idx]}
          />
        ),
      }));
      setTabsData(transformedData); // Update the tasks state with the response data
    } catch (error) {
      console.error(error.message);
    }
  }

  // Function to extract query parameters
  const getid = (param) => {
    try {
      const queryParams = new URLSearchParams(location.search);
      return queryParams.get(param);
    } catch (error) {
      console.warn(error); // Log the error for debugging purposes
      return null; // Return null in case of an error
    }
  };


  return isLoading ? (
    <div className='d-flex justify-content-center mt-5'>
      <DotLottieReact
        src="https://lottie.host/fc278a4c-abe0-4e17-9c4b-d2e06ab3ce6e/FHHmq9VFBO.lottie"
        loop
        autoplay
        style={{ width: '50%', height: '50%' }}
      />
    </div>
  ) : (
    <div className="singleView" id="singleView">
      {taskDetails.task_type_id==10 ? null : <Detailed_View taskDetails={taskDetails} customfields={CustomDetails} refreshDetailedView={getTaskDetails} />}
      <AiDocument />
      <Tabs tabs={tabsData} />
    </div>
  );
};

export default SingleView;
