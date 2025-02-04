import React, { useState, useEffect } from "react";
import axios from "axios";

function EditLogoModal({ task, show, onClose }) {
  const currentSrc = task?.custom_fields?.["Profile Picture"]?.value || "";
  const currentCompanyUrl = task?.custom_fields?.["Company Website"]?.value || "";
  const [customSrc, setCustomSrc] = useState(currentSrc);
  const [companyUrl, setcompanyUrl] = useState(currentCompanyUrl);
  const [filteredCompanyUrl, setfilteredCompanyUrl] = useState()
  const [newcustomFields, setNewcustomFields] = useState({});
  const [updateCustomFields, setupdateCustomFields] = useState({});
  const [Profilepreviewloading, setProfilepreviewloading] = useState(true);
  const [isUploadimgDisable,setisUploadimgDisable] = useState(false);
  let size = 150; 
  
  function changeField(currentValue,newvalue,ID) {
    if (currentValue != newvalue) {
      if (!currentValue == '') {
        //this is new field
        setupdateCustomFields((prevValue) => ({
          ...prevValue,
          [ID]: newvalue,
        }));
      }else{
        setNewcustomFields((prevValue) => ({
          ...prevValue,
          [ID]: newvalue,
        }));
      }
    }
  }

  useEffect(() => {
    if (companyUrl) {
      let trimmedWebsite =''
      try {
          trimmedWebsite = companyUrl.replace(/https?:\/\//, '').replace(/\/$/, '');
          let logoUlr = `https://img.logo.dev/${trimmedWebsite}?token=pk_CVR_tKaFQ0mBXPEs9bO4Pw&size=${size}`
          setfilteredCompanyUrl(logoUlr)
      } catch (error) {
          trimmedWebsite = ''
      }
    }
  }, [companyUrl]);



  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    const formData = new FormData();
    formData.append("file", file);
    formData.append("s3UploadPrefix","Media/ProfilePicture/")
  
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/common/uploadToS3`, {
        method: "POST",
        body: formData,
      });
  
      const data = await response.json();
      if (data.success) {
        const profileurl = data.fileUrl;
        setisUploadimgDisable(false)
        setCustomSrc(profileurl); // Update UI with uploaded image URL
        changeField(currentSrc,profileurl,23);
      } else {
        console.error("Upload failed:", data.error);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handelNewProfileUrl = (event) => {
    const newurl = event.target.value;
    const name = event.target.name;
    if (name == "companyUrl") {
      setcompanyUrl(newurl)
      changeField(currentCompanyUrl,newurl,2)
      return;
    }  
    newurl == '' ? setisUploadimgDisable(false):setisUploadimgDisable(true);
    setCustomSrc(newurl)
    changeField(currentSrc,newurl,23)
  };

  const handleTaskUpdate = async (event) => {
    event.preventDefault(); // Prevent the default form submission
    
    if (Object.keys(updateCustomFields).length > 0) {
      for (const key in updateCustomFields) { 
        try {
          await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/tasks/updateTaskCustomFields/${task.task_id}`, { newId:updateCustomFields[key] ,customFieldId:key});
        } catch (error) {
          console.error("Error updating custom fields:", error);
        }
      }
    }
    

    if (Object.keys(newcustomFields).length > 0) {
      try {
        newcustomFields["newTaskId"]=task.task_id
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/tasks/addTaskCustomFields`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newcustomFields),
        });
  
        if (!response.ok) {
          throw new Error(`Failed to add custom fields: ${response.status}`);
        }
  
        const result = await response.json();
      } catch (error) {
        console.error("Error adding custom fields:", error);
      }
    } 
    onClose(); // Close the modal on success
  };

  return (
    <div className={`modal ${show ? "d-block" : "d-none"} bg-dark bg-opacity-50`} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg rounded-3">
          <div className="modal-header">
            <h5 className="modal-title">Edit Profile Image</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            
            {/* Profile Picture Upload */}
            <div className="row d-flex align-items-center">
            <div className="mb-3 text-center col-3">
              <span className="badge badge-pill badge-primary mb-3">
                {customSrc ? "Img Url" : "Company Url"}
              </span>

              {(customSrc || filteredCompanyUrl) && (
                <div className="d-flex justify-content-center">
                  {Profilepreviewloading && (
                    <div className="spinner-border text-primary" role="status">
                      <span className="sr-only">Loading...</span>
                    </div>
                  )}

                  <img
                    src={customSrc ? customSrc : filteredCompanyUrl}
                    alt="Profile Preview"
                    className="rounded-circle mb-2"
                    style={{
                      width: 150,
                      height: 150,
                      objectFit: "contain",
                      display: Profilepreviewloading ? "none" : "block",
                    }}
                    onLoad={() => setProfilepreviewloading(false)}
                    onError={() => setProfilepreviewloading(false)} // Hide spinner on error as well
                  />
                </div>
              )}
            </div>
              <div className="col">
                <input type="file" className="form-control mt-2" accept="image/*" onChange={handleFileUpload} 
                disabled={isUploadimgDisable}/>
                {/* Image URL */}
                <div className="my-3">
                  <label className="form-label">Profile Picture URL</label>
                  <input
                    type="url"
                    className="form-control border"
                    placeholder="https://example.com/image.jpg"
                    value={customSrc}
                    onChange={handelNewProfileUrl}
                    name="CustomSrc"
                  />
                </div>
              </div>
            </div>


            {/* Company Website */}
            <div className="mb-3">
              <label className="form-label">Company Website</label>
              <div className="d-flex align-items-center">
                {companyUrl && (
                  <img
                    src={filteredCompanyUrl}
                    alt="Company Logo"
                    className="rounded me-2"
                    style={{ width: 40, height: 40, objectFit: "cover" }}
                  />
                )}
                <input
                  type="url"
                  className="form-control"
                  placeholder="https://Axonator.com"
                  value={companyUrl}
                  onChange={handelNewProfileUrl}
                  name="companyUrl"
                />
              </div>
            </div>

          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-primary" onClick={handleTaskUpdate}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditLogoModal;
