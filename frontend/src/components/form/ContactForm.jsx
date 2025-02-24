// Form.jsx
import Dropdown from "./Dropdown";
// import Textarea from "./Textarea";
import Text from "./text";
import { useState,useEffect } from "react";
import Box from '@mui/material/Box';
// import TextField from '@mui/material/TextField';
import axios from "axios";

function ContactForm({ toggleModal,refreshTasks,selectedTabId, selectedTabName, availableCustomFields, taskToEdit}) {
  const [customFields, setCustomFields] = useState({});
  const [insertNewCustomFields,setnewcustomfields]= useState([]);;
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [formData, setFormData] = useState({
    "first_name": taskToEdit?taskToEdit.first_name:"",
    "last_name": taskToEdit?taskToEdit.last_name:"",
    "counter_name":"contacts",
    "table_name":"contact"
  })

  const requiredFields = ['Health','Status'];
  const excludeOtherOption = ['Status','Health','Lead Type','Country','Contact Status'];

  
  const columnCount = 3;
  const columns = Array.from({ length: columnCount }, (_, index) =>
    availableCustomFields.filter((_, i) => i % columnCount === index)
  );
  
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

  const handlecustomSelect = (id,selected_id) => {
    setCustomFields((prevData)=>{return {...prevData,[id]:selected_id}})

  };

  const handleOnChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
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
            body: JSON.stringify({ customFields, table_name: "contact" }),
          });
    
          if (!response.ok) {
            throw new Error(`Failed to add custom fields: ${response.status}`);
          }
    
          const result = await response.json();
          // Refresh the task list after adding a new task
          // setSortOrder('desc');
          refreshTasks();
          toggleModal();
        } catch (error) {
          console.error("Error adding custom fields:", error);
        }
        
      }else{
        // Refresh the task list after adding a new task
        refreshTasks();
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
              body: JSON.stringify({ customFields, table_name: "contact" }),
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
                <div className="row">
                    <div className="col-6">
                        {/* <label htmlFor="name" className="form-label">
                        First Name
                        </label> */}
                        <Text name="first_name" id="first_name" placeholder="First Name" onChange={handleOnChange} value={formData.first_name} required={true}/>
                    </div>
                    <div className="col-6">
                        {/* <label htmlFor="last_name" className="form-label">
                        Last Name
                        </label> */}
                        <Text name="last_name" id="last_name" placeholder="Last Name" onChange={handleOnChange} value={formData.last_name} required={true}/>
                    </div>
                </div>

              <div className="row mt-4" id="all-task-details">
                  {columns.map((column, columnIndex) => (
                    <div key={columnIndex} className={`col-md-${12/columnCount}`}>
                      {column.map((field) => (
                        <div className="mb-3" key={field.custom_field_id}>
                        {/* {field.type != "choice"?<label htmlFor={`customField-${field.custom_field_id}`} className="form-label">
                          {field.display_name_singular}
                        </label>:null} */}
                        
                        {field.type === "text" && (
                          <Text
                            id={`customField-${field.custom_field_id}`}
                            placeholder={`${field.display_name_singular}`}
                            onChange={(e) => handleCustomFieldChange(field.custom_field_id, e.target.value)}
                            value={customFields[field.custom_field_id] || ''}
                          />
                        //   <TextField 
                        //     id={`customField-${field.custom_field_id}`} 
                        //     label={field.display_name_singular}
                        //     variant="outlined" 
                        //     onChange={(e) => handleCustomFieldChange(field.custom_field_id, e.target.value)}
                        //     value={customFields[field.custom_field_id] || ''} 
                        //     />

                        )}
                        
                        {field.type === "number" && (
                          <input
                            type="number"
                            id={`customField-${field.custom_field_id}`}
                            className="form-control"
                            placeholder={`${field.display_name_singular}`}
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
                                placeholder={`${field.display_name_singular}`}
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
                        //   label={`Select ${field.display_name_singular}`}
                          option_label={`${field.display_name_singular}`}
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

export default ContactForm;
