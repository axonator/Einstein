// Form.jsx
import Dropdown from "./Dropdown";
import Textarea from "./Textarea";
import Text from "./text";
import { useState,useEffect } from "react";
import axios from "axios";

function FormComponent({ toggleModal,refreshTasks,parent_task_id,selectedTabId, selectedTabName, availableCustomFields, taskToEdit, totalPages, setSortOrder, setCurrentPage}) {
  const [customFields, setCustomFields] = useState({});
  const [insertNewCustomFields,setnewcustomfields]= useState([]);;
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [formData, setFormData] = useState({
    "name":taskToEdit?taskToEdit.task_name:"",
    "taskData" :taskToEdit?taskToEdit.task_data:"",
    "task_type_id":selectedTabId,
    "statusId":taskToEdit?taskToEdit.status_id:"",
    "parent_task_id":parent_task_id,
    "counter_name":"contacts",
    "table_name":"task"
  })

  const requiredFields = ['Health','Status'];
  const excludeOtherOption = ['Status','Health','Lead Type','Country'];

  const [statuses, setStatuses] = useState([]); // For storing statuses list
  const columnCount = 3;
  const columns = Array.from({ length: columnCount }, (_, index) =>
    availableCustomFields.filter((_, i) => i % columnCount === index)
  );
  
  // Fetch function
  const fetchdropdownlist = async (table_name, column_name="*",condition='') => {
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

      const stateUpdaters = {
        status: setStatuses,
      };

      const updater = stateUpdaters[table_name.toLowerCase()];

      if (updater) {
        updater(requestedList);
        
      } else {
        console.warn(`No state updater found for table_name: ${table_name}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

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
      
      if (!excludeOtherOption.includes(listName)) {
        const other = {
          "lookup_id":404,
          "fk_custom_field_id":404,
          "option":"Add +"
        }
        taskToEdit ? null : requestedList.push(other)
        
      }
      setDropdownOptions((prevalue)=>({
        ...prevalue,[listName]:requestedList
      }));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchdropdownlist("status");
    handlestatusSelect()
  },[]);

  // Update the `customFields` state when `taskToEdit` is available
useEffect(() => {
  if (taskToEdit && taskToEdit.custom_fields) {
    
    // Initialize customFields state based on taskToEdit
    const newfields = []
    const initialCustomFields = {};
    availableCustomFields.forEach((field) => {
      const fieldName = field.display_name_singular;
      if(taskToEdit.custom_fields[fieldName]){
        const type = field.type;
        if (type == 'choice') {
          initialCustomFields[field.custom_field_id] = taskToEdit.custom_fields[fieldName].lookupId || '';
        }else{
          initialCustomFields[field.custom_field_id] = taskToEdit.custom_fields[fieldName].value || '';
        }
      }
      else{
        newfields.push(`${field.custom_field_id}`)
      }
    });
    setnewcustomfields(newfields)
    setCustomFields(initialCustomFields);
  }
}, [taskToEdit, availableCustomFields]);

  const handlestatusSelect = (id,selected_id) => {
    setFormData((prevData)=>{return {...prevData,[id]:selected_id}})

  };

  const handlecustomSelect = (id,selected_id) => {
    setCustomFields((prevData)=>{return {...prevData,[id]:selected_id}})

  };

  const handleOnChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleRichTextChange = (value) => {
    // Handle the change for rich text editor
    setFormData((prevData) => ({ ...prevData, taskData: value }));
  };

  // Update custom field state
  const handleCustomFieldChange = (fieldId, value) => {
    setCustomFields((prevFields) => ({
      ...prevFields,
      [fieldId]: value,
    }));
  };

  useEffect(() => {
    availableCustomFields.forEach((field) => {
      if (field.type === "choice") {
        fetchcustomdropdownlist('lookup', "*", "WHERE fk_custom_field_id=" + field.custom_field_id, field.display_name_singular);
      }
    });
  }, [availableCustomFields]);

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent the default form submission
    const payload = { formData, customFields };
    // Check for strings in customFields
    let addNewlookup = {
      "table_name": "lookup",
      "columns": ["fk_custom_field_id", "`option`"],
      "values": [],
      "onlyValues":[]
    };

    Object.entries(customFields).forEach(([key, value]) => {
      
      if (typeof value === "string") {
        if (value.includes('add404')) {
          const updatedValue = value.replace('add404','')
          customFields[key] = updatedValue;
          let newValue = [key, updatedValue];
          addNewlookup['values'].push(newValue);
          addNewlookup['onlyValues'].push(updatedValue);
        }

      }
    });
    
    if (addNewlookup['values'].length > 0) {
      try {
        const response = await axios.post(`${import.meta.env.VITE_LOCAL_URL}/api/tasks/addNewRows`, addNewlookup);
        // Replace `customFields` values with corresponding IDs
        const responseMapping = response.data;
        Object.entries(customFields).forEach(([key, value]) => {
          if (responseMapping[value]) {
            customFields[key] = responseMapping[value];
          }
        });

      } catch (error) {
        console.error("Error in submitting task:", error);
      }
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_LOCAL_URL}/api/tasks/add_task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Failed to add task: ${response.status}`);
      }

      const result = await response.json();
      let newTaskId = result.id
      if (Object.keys(customFields).length>0) {
        try {
          customFields["newTaskId"]=newTaskId
          
          const response = await fetch(`${import.meta.env.VITE_LOCAL_URL}/api/tasks/addTaskCustomFields`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ customFields, table_name: "task" }),
          });
    
          if (!response.ok) {
            throw new Error(`Failed to add custom fields: ${response.status}`);
          }
    
          const result = await response.json();
          // Refresh the task list after adding a new task
          // setSortOrder('desc');
          // setCurrentPage(totalPages);
          refreshTasks('desc',totalPages);
          toggleModal();
        } catch (error) {
          console.error("Error adding custom fields:", error);
        }
        
      }else{
        // Refresh the task list after adding a new task
        // setSortOrder('desc');
        // setCurrentPage(totalPages);
        refreshTasks('desc',totalPages);
        toggleModal();
      }
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handeltaskupdate = async (event) => {
    event.preventDefault(); // Prevent the default form submission
    const payload = { formData, customFields };
    
    try {
      // Make an API call to update the task Fiedls
      await axios.post(`${import.meta.env.VITE_LOCAL_URL}/api/tasks/updateTaskFields/${taskToEdit.task_id}`, {formData });
      
      if(Object.keys(customFields).length>0){
        for (const key in customFields) {
          if (! insertNewCustomFields.includes(key)) {
            await axios.post(`${import.meta.env.VITE_LOCAL_URL}/api/tasks/updateTaskCustomFields/${taskToEdit.task_id}`, { newId:customFields[key] ,customFieldId:key});
            delete customFields[key]
          }
        }

        if (Object.keys(customFields).length>0) {
          try {
            customFields["newTaskId"]=taskToEdit.task_id
            const response = await fetch(`${import.meta.env.VITE_LOCAL_URL}/api/tasks/addTaskCustomFields`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ customFields, table_name: "task" }),
            });
      
            if (!response.ok) {
              throw new Error(`Failed to add custom fields: ${response.status}`);
            }
      
            const result = await response.json();
          } catch (error) {
            console.error("Error adding custom fields:", error);
          }
        } 
      }
      refreshTasks();
      toggleModal();
    } catch (error) {
      console.error("Failed to update task custom fields:", error);
    }
  };


  return (
    <div className="modal d-block bg-light bg-opacity-50">
      <div className="modal-dialog modal-lg">
        <div className="modal-content p-4">
          <div className="modal-header">
            <h5 className="modal-title">{taskToEdit ? "Edit" : "Add New"} {selectedTabName}</h5>
            <button className="btn-close" onClick={toggleModal}></button>
          </div>
          <div className="modal-body">
            <form onSubmit={taskToEdit?handeltaskupdate:handleSubmit}>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">
                  Display Name
                </label>
                <Text name="name" id="name" placeholder="Enter Display Name" onChange={handleOnChange} value={formData.name} required={true}/>
              </div>

              <div className="mb-3">
                <label htmlFor="taskData" className="form-label">
                  Task Data
                </label>
                <Textarea
                  name="taskData"
                  id="taskData"
                  placeholder="Enter your taskData here"
                  onChange={handleRichTextChange}
                  value={formData.taskData}
                />
              </div>

              <Dropdown
                options={statuses}
                onSelect={handlestatusSelect}
                label="Status"
                option_label="Select the Status"
                name_colum="display_name"
                id_column="status_id"
                id="statusId"
                preselectedId={formData.statusId}
                required ={true}
              />

              <div className="row mt-4" id="all-task-details">
                  {columns.map((column, columnIndex) => (
                    <div key={columnIndex} className={`col-md-${12/columnCount}`}>
                      {column.map((field) => (
                        <div className="mb-3" key={field.custom_field_id}>
                        {field.type != "choice"?<label htmlFor={`customField-${field.custom_field_id}`} className="form-label">
                          {field.display_name_singular}
                        </label>:null}
                        
                        {field.type === "text" && (
                          <Text
                            id={`customField-${field.custom_field_id}`}
                            placeholder={`Enter ${field.display_name_singular}`}
                            onChange={(e) => handleCustomFieldChange(field.custom_field_id, e.target.value)}
                            value={customFields[field.custom_field_id] || ''}
                          />
                        )}
                        
                        {field.type === "number" && (
                          <input
                            type="number"
                            id={`customField-${field.custom_field_id}`}
                            className="form-control"
                            placeholder={`Enter ${field.display_name_singular}`}
                            onChange={(e) => handleCustomFieldChange(field.custom_field_id, e.target.value)}
                            onWheel={(e) => e.target.blur()} // Prevent number input from scrolling
                            value={customFields[field.custom_field_id] || ''}
                          />
                        )}

                        {field.type === "url" && (
                            <div className="d-flex align-items-center">
                              {field.custom_field_id === 2 && customFields[field.custom_field_id] && (
                                (() => {
                                  const trimmedWebsite = customFields[field.custom_field_id]
                                    .replace(/https?:\/\//, '')
                                    .replace(/\/$/, '');
                                  return (
                                    <img
                                      src={`https://img.logo.dev/${trimmedWebsite}?token=pk_CVR_tKaFQ0mBXPEs9bO4Pw&size=40`}
                                      alt={`${trimmedWebsite} Logo`}
                                      className="rounded me-2"
                                      style={{ width: 40, height: 40, objectFit: "cover" }}
                                    />
                                  );
                                })()
                              )}
                              <input
                                type={field.display_name_singular.toLowerCase() === "email" ? "email" : "url"}
                                id={`customField-${field.custom_field_id}`}
                                className="form-control"
                                placeholder={`Enter ${field.display_name_singular}`}
                                onChange={(e) => handleCustomFieldChange(field.custom_field_id, e.target.value)}
                                value={customFields[field.custom_field_id] || ''}
                              />
                            </div>
                          )
                        }

                        {field.type === "choice" && (
                          <Dropdown
                          options={dropdownOptions[field.display_name_singular]} // Use the fetched options here
                          onSelect={handlecustomSelect}
                          label={`Select ${field.display_name_singular}`}
                          option_label={`Choose ${field.display_name_singular}`}
                          name_colum="option"
                          id_column="lookup_id"
                          id={field.custom_field_id}
                          // preselectedId ={taskToEdit?taskToEdit.custom_fields[field.display_name_singular].lookupId:false}
                          preselectedId={customFields[field.custom_field_id] || null}
                          required = {requiredFields.includes(field.display_name_singular)}
                        />
                        )}
                        {field.type === "date" && (
                          <input
                            type="date"
                            id={`customField-${field.custom_field_id}`}
                            className="form-control"
                            onChange={(e) => handleCustomFieldChange(field.custom_field_id, e.target.value)}
                            value={customFields[field.custom_field_id] || ''}
                          />
                        )}
                      </div>
                      ))}
                    </div>
                  ))}
                </div>

              <button type="submit" className="btn btn-primary">
                {taskToEdit ? "Update" : "Submit"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FormComponent;
