import React, { useState, useRef, useEffect } from "react";
import Titlebox from "./titlebox";
import ActionBtns from "./actionBtns";
import CustomFiledData from "./customfileds";
import "./taskCard.css";
import { getAppliedTags, getAvailableTags,removeTag, applyNewTag, addNewTag } from "../../../helper/helper";
import Text from "../../form/text";

function TaskCardTopSection({ task,fetchTasks }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [maxHeight, setMaxHeight] = useState("100px");
  const contentRef = useRef(null);
  const [showAddNewTag, setShowAddNewTag] = useState(false);
  const [appliedTags, setappliedTags] = useState([]);
  const [AvailableTags, setAvailableTags] = useState([]);
  const [newTagName,setnewTagName]= useState("")


  const HandleNewTag = (event) => {
    const { name, value } = event.target;
    setnewTagName(value);
  };

  const handleTagChange = async(tagId,action) => {
    action == "apply" ?
    await applyNewTag(tagId, task.task_id) :
    await removeTag(tagId, task.task_id)
    fetchTasks();
  };

  const handelNewTag = async (event) => {
    event.preventDefault(); // Prevent the default form submission
    const newTagId = await addNewTag(newTagName)
    handleTagChange(newTagId,"apply")
    setShowAddNewTag(!showAddNewTag)
  };

  useEffect(() => {
    const fetchTags = async () => {
      const applied = await getAppliedTags(task.task_id);
      const available = await getAvailableTags();
      // Filter out tags that are already applied
      if (applied && Object.keys(applied).length > 0) {
        const FilterAvailable = available.filter(
          (tag) => !applied.some((appliedTag) => appliedTag.tag_id === tag.tag_id)
        );
        setAvailableTags(FilterAvailable);
      }else{
        setAvailableTags(available);
      }
      
      setappliedTags(applied);
    };
  
    fetchTags();
  }, [task]);

  // Group custom fields for rendering in 3 columns, excluding specific keys
  const excludedKeys = ['country', 'state', 'city', 'profile picture','health'];
  const filteredCustomFields = Object.entries(task.custom_fields || {}).filter(
    ([key]) => !excludedKeys.includes(key.toLowerCase())
  );

  const columnCount = 2;
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
      setMaxHeight("100px");
    }
  }, [isExpanded]);

  return (
    <div className="col">
      {/* Header Section */}
      <div className="row">
        <div className="col d-flex">
          <Titlebox task={task} subtitle={"Latest AI document"} />
          {/* <ActionBtns/> */}
          <CustomFiledData task={task} />
        </div>
      </div>
      {/* Details Grid */}
      <div className="row mt-4" id="all-task-details">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="col-md-6">
            {column.map(([key, value]) => (
              <p key={key} className="m-2">
                <strong>{key}:</strong> {value.value || "N/A"}
              </p>
            ))}
          </div>
        ))}
      </div>

      {/* Task Data Section */}
      <div className="row mt-3">
        <div
          ref={contentRef}
          className={`task-data-container ${isExpanded ? "expanded" : ""} bg-light`}
          onClick={toggleExpand}
          style={{ maxHeight }}
          dangerouslySetInnerHTML={{ __html: task.task_data }}
        ></div>
        {!isExpanded && (
          <div
            style={{
              textAlign: "center",
              marginTop: "-20px",
              cursor: "pointer",
              color: "#007bff",
            }}
          >
                    <i className="bi bi-arrow-bar-down"></i>
          </div>
        )}
      </div>

      <div className="d-flex align-items-center flex-wrap gap-3 mt-3">
        {/* Available Tags Dropdown */}
        <div className="btn-group">
          <button className="btn btn-outline-secondary btn-sm" type="button" onClick={()=>setShowAddNewTag(!showAddNewTag)}>
            New Tag
          </button>
          {AvailableTags && AvailableTags.length > 0 && (
            <>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary dropdown-toggle dropdown-toggle-split"
                data-bs-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              ></button>
              <ul className="dropdown-menu">
                {AvailableTags.map((tag) => (
                  <li key={tag.tag_id} id={tag.tag_id} onClick={()=>handleTagChange(tag.tag_id, "apply")}>
                    <a className="dropdown-item">{tag.display_name}</a>
                  </li>
                ))}
              </ul>
            </>)}
        </div>
        {/* Applied Tags */}
        {appliedTags && appliedTags.length > 0 && (
          <div className="d-flex flex-wrap align-items-center">
          {appliedTags.map((tag) => (
            <span key={tag.tag_id} className="badge badge-pill badge-primary me-2 d-flex align-items-center">
              {tag.display_name}
              <button
                type="button"
                className="btn-close ms-2"
                onClick={() => handleTagChange(tag.tag_id,"remove")}
                aria-label="Close"
              ></button>
            </span>
          ))}
        </div>
        )}
      </div>

      {showAddNewTag && (
        
        <div className="modal d-block bg-light bg-opacity-50">
        <div className="modal-dialog modal-sm">
          <div className="modal-content">
            <div className="modal-body">
              <form onSubmit={handelNewTag}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    Add New Tag
                  </label>
                  <Text name="name" id="name" placeholder="Enter New Tag Name" onChange={HandleNewTag} value={newTagName} required={true}/>
                </div>
  
                <button type="submit" className="btn btn-primary">
                  Add
                </button>
                <button 
                  className="ms-2 btn btn-outline-secondary" 
                  onClick={()=>setShowAddNewTag(!showAddNewTag)}>
                  Cancel
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
        )}

    </div>
  );
}

export default TaskCardTopSection;
