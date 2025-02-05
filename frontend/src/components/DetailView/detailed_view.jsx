import React from "react";
import { useState,useEffect,useRef } from "react";
import "./DetailedView.css";
import {isCustomFieldAvailable} from "../../helper/helper"
import DeletePopup from "../common/deletepopup";
import LogoBox from "../ListView/taskcard/LogoBox";
import FormComponent from "../form/From";
import { getcustomFields } from "../../helper/helper";
import { MdEditNote } from "react-icons/md";
import { MdOutlineExpandMore } from "react-icons/md";

const Detailed_View = ({ taskDetails, customfields,refreshDetailedView }) => {
  taskDetails.custom_fields = customfields;  
  const [showDeletePopup, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [availableCustomFields,setavailableCustomFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [maxHeight, setMaxHeight] = useState("100px");
  const [linkedinData, setLinkedinData] = useState(null);
  const contentRef = useRef(null);

 // Group custom fields for rendering in 3 columns, excluding specific keys
const excludedKeys = ['health', 'profile picture', 'company website'];
const excludeLinkedin = ['urn','profile_image_url','profile_id','linkedin_url','experiences','educations','company_logo_url','company_domain','company','company_description','connection_count','current_company_join_month','first_name','last_name','public_id','school'];
const filteredCustomFields = Object.entries(customfields || {}).filter(
  ([key]) => !excludedKeys.includes(key.toLowerCase())
);

const columnCount = 3;
const columns = Array.from({ length: columnCount }, (_, index) =>
  filteredCustomFields.filter((_, i) => i % columnCount === index)
);

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  useEffect(() => {
    if (isExpanded) {
      setMaxHeight(`${contentRef.current.scrollHeight}px`);
    } else {
      setMaxHeight("50px");
    }
  }, [isExpanded]);

  
  let trimmedWebsite =''
    try {
        const website = customfields['Company Website'].value;
        trimmedWebsite = website.replace(/https?:\/\//, '').replace(/\/$/, '');
        
    } catch (error) {
        trimmedWebsite = ''
    }

    async function formcustomfields() {
      const data = await getcustomFields(taskDetails.task_type_id,setError,setLoading);
      setavailableCustomFields(data)
      setShowForm(true)
    }

    async function fetchLinkedinData(linkedinUrl) {
      try {
        const response = await fetch(`${import.meta.env.VITE_LOCAL_URL}/api/linkedin/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ linkedinUrl: linkedinUrl }),
        });
  
        if (!response.ok) {
          throw new Error(`Failed to fetch tasks: ${response.status}`);
        }
  
        const data = await response.json();
        setLinkedinData(data); // Store data in state
      } catch (error) {
        console.log("error fetching linkedin details",error);
      }
    }

    // Handle modal toggle
  const toggleModal = () => {
    setShowForm(!showForm);
  };
  
  return (
    <div className="container pt-4 DetailedView">
      {/* Error message */}
      {error && <div className="alert alert-danger">{error}</div>}
      {/* Header Section */}
      <div className="row align-items-center">
        {trimmedWebsite &&
          <div className="col-md-1">
              <LogoBox company_website={trimmedWebsite} task={taskDetails}/>
          </div>
        }
        <div className="col-md ps-3">
          <h4 className="m-0"><a className="text-decoration-none" href={isCustomFieldAvailable("Company Website",customfields)} target="_blank">{taskDetails.task_name}</a> </h4>
          <small className="text-muted">{taskDetails.parent_task_name == "Root" ? "" : taskDetails.parent_task_name}</small>
        </div>
        <div className="col-md text-end">
          {Object.keys(customfields)==0?null:<span className={`badge bg-${customfields["Health"].value.toLowerCase()} me-2`}>{customfields['Health'].value}</span>}
          <span className="badge bg-primary">{taskDetails.status}</span>
          <div className="mt-2">
            <span>X%</span>
            <button className="btn btn-link p-0 ms-3 text-danger" onClick={()=>setShowModal(true)}>
              <i className="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Project Details Section */}
      <div className="row mt-4">
        <div className="col-12">
          <h5>{taskDetails.task_type} Details <MdEditNote className="" onClick={()=>formcustomfields()}/></h5>
          <div className="p-2 mb-3 border border-dashed rounded bg-light">
            <div 
              ref={contentRef}
              dangerouslySetInnerHTML={{ __html: taskDetails.task_data }} 
              className={`task-data-Detailedcontainer ${isExpanded ? "expanded" : ""} `}
              onClick={toggleExpand}
              style={{maxHeight}}>

            </div>
            {!isExpanded && (
              <div
                style={{
                  textAlign: "center",
                  marginTop: "-20px",
                  cursor: "pointer",
                  color: "#007bff",
                }}
              >
                <MdOutlineExpandMore />

              </div>
            )}
          </div>
          <div className="d-flex flex-wrap">
            <span className="badge bg-light text-dark me-2">Tags</span>
            <span className="badge bg-light text-dark me-2">Tags</span>
            <span className="badge bg-light text-dark">Tags</span>
          </div>
          <div>
            <button className="btn btn-outline-primary mt-4" onClick={()=>fetchLinkedinData(taskDetails.custom_fields['Contact Linkedin'].value)}>Fetch Linkedin Data</button>
            {linkedinData && (
              <div className="mt-4 p-3 border rounded bg-light">
                <h5>Fetched LinkedIn Data</h5>
                <a href={taskDetails.custom_fields['Contact Linkedin'].value}>
                  <img
                    src={linkedinData.profile_image_url}
                    className="rounded-circle"
                    style={{
                      width: "80px",
                      height: "80px",
                      cursor: "pointer",
                      objectFit: "contain",
                    }}
                  />
                </a>
                <div className="row mt-3">
                  {Object.entries(linkedinData)
                    .filter(([key]) => !excludeLinkedin.includes(key)) // Exclude fields & check value existence
                    .map(([key, value], index) => (
                      value?
                      <div key={index} className={typeof value === "string" && value.length > 50 ? "col-md-12 mb-2" : "col-md-6 mb-2"} >
                        <strong>{key.replace(/_/g, " ")}:</strong>{" "}
                        {typeof value === "string" && value.includes("https") ? (
                          <a href={value} target="_blank" rel="noopener noreferrer">{value}</a>
                        ) : (
                          value
                        )}
                      </div>
                      :null
                    ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="row mt-4" id="all-task-details">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="col-md-4">
            {column.map(([key, value]) => (
              <p key={key} className="m-2">
                <strong>{key}:</strong> {value.value || "N/A"}
              </p>
            ))}
          </div>
        ))}
      </div>

      {/* Conditional Rendering of DeletePopup */}
      {showDeletePopup && (
        <DeletePopup
          task={taskDetails}
          fetchTasks={"fetchTasks"}
          onclose={setShowModal} // Close modal handler
        />
      )}

      {showForm && (
        <FormComponent 
        toggleModal={toggleModal} 
        refreshTasks={refreshDetailedView} 
        parent_task_id={taskDetails.parent_task_id} 
        selectedTabId={taskDetails.task_type_id} 
        selectedTabName={taskDetails.task_type} 
        availableCustomFields={availableCustomFields} 
        taskToEdit={taskDetails}/>)}

    </div>

    
  );
};

export default Detailed_View;
