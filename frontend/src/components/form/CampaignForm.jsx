import Text from "./text";
import Textarea from "./Textarea";
import { useState,useEffect } from "react";
import axios from "axios";
import moment from "moment";
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import MultiSelectDropdown from "./MultiSelectDropdown";
import AddBoxRoundedIcon from '@mui/icons-material/AddBoxRounded';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';

function CampaignForm({ toggleModal,refreshTasks, CampaignDetails=false}) {
    const getFormattedDate = (date) => {
        return date.toISOString().split("T")[0];
    };
    
    const today = getFormattedDate(new Date());
    const tomorrow = getFormattedDate(new Date(new Date().setDate(new Date().getDate() + 1)));

    const now = new Date();
    const currentHour = now.getHours(); // Hours (0-23) 14
    const currentMinutes = now.getMinutes(); // Minutes (0-59) 7

    const daysofweek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const [campaign_name, setcampaign_name] = useState(CampaignDetails?CampaignDetails.name:"");
    const [description, setdescription] = useState(CampaignDetails?CampaignDetails.description:"");
    const [raw_subject, setraw_subject] = useState(CampaignDetails?CampaignDetails.raw_subject:"");
    const [raw_body, setraw_body] = useState(CampaignDetails?.raw_body || ""); 
    const [start_date, setstart_date] = useState(CampaignDetails && CampaignDetails.start_date ? CampaignDetails.start_date : today);
    const [end_date, setend_date] = useState(CampaignDetails && CampaignDetails.end_date ? CampaignDetails.end_date : tomorrow);
    const [days_of_week, setdays_of_week] = useState(CampaignDetails?CampaignDetails.days_of_week:[0, 0, 0, 0, 0, 0, 0]); // Default: No days selected
    const [time_to_send, setTime_to_send] = useState(
      Array.isArray(CampaignDetails?.time_to_send) ? CampaignDetails.time_to_send : [`${currentHour}:${currentMinutes}`, `${currentHour+1}:${currentMinutes}`]
    );
    const [senderEmails, setsenderEmails] = useState([]); // For storing senderEmails list
    const [totalCampaignMails, settotalCampaignMails] = useState(0);
    const [delayBetweenMails, setdelayBetweenMails] = useState(5);
    const [IsNewSender, setIsNewSender] = useState(false);
    const [newSenderDetails, setnewSenderDetails] = useState({
      email : "",
      password : ""
    });
    

    const [formData, setFormData] = useState({
        "table_name":"campaign",
        "columns" : ["name", "description", "start_date", "end_date", "days_of_week", "time_to_send", "raw_subject", "raw_body", "max_contacts"],
        "values" : [],
        "onlyValues" : ["newCampaignId"]
    })

    const [Label, setLabel] = useState([]);
    const [selectedSenderIds, setSelectedSenderIds] = useState([]);
    
    const handleSenderChange = (event) => {
      const { value } = event.target;
      const selectedoptions = typeof value === 'string' ? value.split(',') : value;
  
      // Extract the corresponding IDs for selected options
      const selectedSenderIds = selectedoptions.map(name => {
        const foundItem = senderEmails.find(item => item["email"] === name);
        return foundItem ? foundItem["id"] : null;
      }).filter(id => id !== null); // Filter out any null values
  
      setLabel(selectedoptions);
      setSelectedSenderIds(selectedSenderIds);
    };

    function calculateTotalMins() {
      const [start, end] = time_to_send.map(time => {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes; // Convert to minutes
      });
      return end - start; // Difference in minutes
    }

    function getActiveDays() {
        let start = moment(start_date, "YYYY-MM-DD"); // Update format if needed
        let end = moment(end_date, "YYYY-MM-DD"); // Update format if needed
        let activeDays = 0;
    
        while (start.isSameOrBefore(end)) {  // Use .isSameOrBefore() instead of <=
            let dayOfWeek = start.isoWeekday() - 1; // Convert Monday=0, Sunday=6
            if (days_of_week[dayOfWeek] === 1) {
                activeDays++;
            }
            start.add(1, "days"); // Move to the next day
        }
        return activeDays;
    }

    function calculateTotalCampaignMails() {
      const totalminutes = calculateTotalMins();
      const activeDays = getActiveDays();
      const mails = (totalminutes/delayBetweenMails) * selectedSenderIds.length * activeDays
      settotalCampaignMails(mails);
      return
    }



    const fetchdropdownlist = async (table_name, column_name="*",condition='') => {
        try {
          const response = await fetch(`${import.meta.env.VITE_LOCAL_URL}/api/common/get_list`, {
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
    
          setsenderEmails(requestedList);
        } catch (error) {
          console.error(error);
        }
      };

  const handleDayChange = (index) => {
      setdays_of_week((prevDays) => {
          const updatedDays = [...prevDays];
          updatedDays[index] = updatedDays[index] === 1 ? 0 : 1; // Toggle selection
          return updatedDays;
        });
    };

    const handletimeChange = (event) => {
        const timeName = event.target.name;
        const timeid = event.target.id;
        const newTime = event.target.value;

        if (timeid === "start_time") {
            if (newTime > time_to_send[1]) {
                alert("Start time cannot be greater than end time!");
                return;
            }
        } else {
            if (time_to_send[0] > newTime) {
                alert("End time cannot be earlier than start time!");
                return;
            }
        }

        setTime_to_send((prevTime) => {
            const updatedDays = [...prevTime];
            updatedDays[timeName] = event.target.value;
            return updatedDays;
        });
    };

    const handledatechange = (event) => { 
        const dateid = event.target.id;
        const newdate = event.target.value;

        if (dateid === "start_date") {
            if (newdate > end_date) {
                alert("Start date cannot be greater than end date!");
                return;
            }
            setstart_date(newdate);
        } else {
            if (start_date > newdate) {
                alert("End date cannot be earlier than start date!");
                return;
            }
            setend_date(newdate);
        }
    };
    
    const handleRichTextChange = (value) => {
      setraw_body(value);
    };

    useEffect(() => {
      calculateTotalCampaignMails();
      }, [start_date, end_date, days_of_week, time_to_send, selectedSenderIds]);
      

  useEffect(() => {
        setFormData((prevformdata) => ({
            ...prevformdata,
            values: [
                campaign_name,
                description,
                start_date,
                end_date,
                days_of_week,
                time_to_send,
                raw_subject,
                raw_body,
                totalCampaignMails
            ]
        }));
    }, [campaign_name, description, start_date, end_date, days_of_week, time_to_send, selectedSenderIds,raw_subject, raw_body,totalCampaignMails]);

    useEffect(()=>{
        fetchdropdownlist("sender_email");
    },[])

  


  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent the default form submission
    try {
      const AddCampaignResponse = await axios.post(`${import.meta.env.VITE_LOCAL_URL}/api/common/addNewRows`, formData);
      const newCampaignId = AddCampaignResponse.data["newCampaignId"]

      selectedSenderIds.forEach(senderId => {
        const senderData = {
          "table_name":"campaign__sender",
          "columns" : ["fk_sender_id", "fk_campaign_id"],
          "values" : [senderId,newCampaignId],
          "onlyValues" : []
        }
        axios.post(`${import.meta.env.VITE_LOCAL_URL}/api/common/addNewRows`, senderData);
      });
      
        toggleModal()
        refreshTasks()

    } catch (error) {
      console.error("Error in adding campaign:", error);
    }
    
  };

  function toggleIsNewSender() {
    setIsNewSender(!IsNewSender);
  }


  async function handleNewSenderDetails(event) {
    const { name, value } = event.target;
    setnewSenderDetails((prevValue) => ({
      ...prevValue,
      [name]: value, // Correct way to update state dynamically
    }));
  }

  async function checkSenderCredentials() {
      try {
        const response = await axios.post("https://ujgeoktk5ln5v2qis4oyzq4ww40iucsr.lambda-url.ap-south-1.on.aws/", {
            GMAIL_USER: newSenderDetails.email,
            GMAIL_PASSWORD: newSenderDetails.password,
            forValidation: true
        });
        if (response.status === 200) {
          
            await axios.post(`${import.meta.env.VITE_LOCAL_URL}/api/common/addNewRows`, {
                table_name: "sender_email",
                columns: ["email", "password"],
                values: [newSenderDetails.email, newSenderDetails.password]
            });
            fetchdropdownlist("sender_email");
            setIsNewSender(false);
        } else {
            alert("Invalid sender credentials.");
        }
    } catch (error) {
      console.error("Sender validation failed:", error);
      if (confirm("Failed to validate sender. Please check the document: \n\nhttps://docs.google.com/document/d/1pLJJk-RbFKeytpnhsS3hK8m-SsGDNBsTf1lGi_poHOM/edit?usp=sharing")) {
          window.open("https://docs.google.com/document/d/1pLJJk-RbFKeytpnhsS3hK8m-SsGDNBsTf1lGi_poHOM/edit?usp=sharing", "_blank");
      }
  }
  }

  const handeltaskupdate = async (event) => {
    event.preventDefault(); // Prevent the default form submission
    
    try {
      // Make an API call to update the task Fiedls
      await axios.post(`${import.meta.env.VITE_LOCAL_URL}/api/common/updateFields/${CampaignDetails.task_id}`, {formData });
      
      refreshTasks();
      toggleModal();
    } catch (error) {
      console.error("Failed to update task custom fields:", error);
    }
  };

  const getButtonClass = (index, day) => {
        if (days_of_week[index] === 1) {
            return day === "Sun" ? "btn-danger" : "btn-primary";
        } else {
            return day === "Sun" ? "btn-outline-danger" : "btn-outline-secondary";
        }
    };

    


  return (
    <div className="modal d-block bg-light bg-opacity-50">
      <div className="modal-dialog modal-lg">
        <div className="modal-content p-4">
          <div className="modal-header">
            <h5 className="modal-title">{CampaignDetails ? "Edit" : "Add New"} Campaign</h5>
            <button className="btn-close" onClick={toggleModal}></button>
          </div>
          <div className="modal-body">
          <form onSubmit={CampaignDetails?handeltaskupdate:handleSubmit}>
                <div className="row">
                    <div className="col-6">
                        <Text name="name" id="name" placeholder="Campaign Name" onChange={(e)=> setcampaign_name(e.target.value)} value={campaign_name} required={true}/>
                    </div>
                    <div className="col-3">
                        <input
                            type="date"
                            id="start_date"
                            className="form-control"
                            onChange={handledatechange}
                            value={start_date}
                            min={today}
                            max={end_date}
                        />
                    </div>
                    <div className="col-3">
                        <input
                            type="date"
                            id="end_date"
                            className="form-control"
                            onChange={handledatechange}
                            value={end_date}
                            min={tomorrow}
                        />
                    </div>
                </div>

                <div className="row mt-2">
                    <div className="col-12">
                        <Text name="description" id="description" placeholder="Campaign Description" onChange={(e)=>setdescription(e.target.value)} value={description} required={true}/>
                    </div>
                </div>

                <div className="row mt-4">
                    <label htmlFor="raw_subject" className="form-label">
                        Mail Details : 
                    </label>
                    <div className="col-12">
                        <Text name="raw_subject" id="raw_subject" placeholder="Mail Subject" onChange={(e)=>setraw_subject(e.target.value)} value={raw_subject} required={true}/>
                    </div>
                    <div className="col-12 mt-2">
                    <Textarea
                      name="raw_body"
                      id="raw_body"
                      placeholder="Enter your Mail Body"
                      value={raw_body || ""}
                      onChange={handleRichTextChange}
                    />
                    </div>
                </div>

                <div className="row my-2">
                    <div className="col-3">
                        <label htmlFor="start_time" className="form-label">
                            Start Time <span className="small">(IST)</span>
                        </label>
                        <input
                            type="time"
                            id="start_time"
                            className="form-control"
                            name="0"
                            onChange={handletimeChange}
                            value={time_to_send[0]}
                            placeholder="Start Time"
                          />
                    </div>
                    <div className="col-3">
                        <label htmlFor="end_time" className="form-label">
                            End Time <span className="small">(IST)</span>
                        </label>
                        <input
                            type="time"
                            id="end_time"
                            name="1"
                            className="form-control"
                            onChange={handletimeChange}
                            value={time_to_send[1]}
                            placeholder="End Time"
                          />
                    </div>

                    <div className="col-6">
                        <label className="mb-2">Select Days:</label>
                        <div className="d-flex flex-wrap gap-2">
                            {daysofweek.map((day, index) => (
                                <button
                                    key={index}
                                    className={`btn btn-sm ${getButtonClass(index, day)}`}
                                    type="button" // Add this line to prevent form submission
                                    onClick={() => handleDayChange(index)}
                                >
                                {day}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
                <div className="row d-flex align-items-center">
                  <div className="col-11">
                    <MultiSelectDropdown 
                      options={senderEmails} 
                      placeholder={"Select the Senders"}
                      name_colum="email"
                      id_column="id"
                      Label = {Label} 
                      setLabel = {setLabel} 
                      selectedSenderIds = {selectedSenderIds}
                      setSelectedIds = {setSelectedSenderIds}
                      onSelect={handleSenderChange}
                    />
                  </div>
                  <div className="col-1">
                    <Tooltip title = "Add Sender">
                        <IconButton size='small' className='ms-1' onClick={toggleIsNewSender}>
                            <AddBoxRoundedIcon/>
                        </IconButton>
                    </Tooltip>
                  </div>
                  {IsNewSender && 
                    <div className="row mt-3">
                      <p>Add New Sender Details :</p>
                      <div className="col">
                        <Text type="email" name="email" id="email" placeholder="Email" onChange={handleNewSenderDetails} value={newSenderDetails.email} required={true}/>
                      </div>
                      <div className="col">
                        <Text type="password" name="password" id="password" placeholder="Password" onChange={handleNewSenderDetails} value={newSenderDetails.password} required={true}/>
                      </div>
                      <div className="col">
                        <Tooltip title = "verify credentials">
                            <IconButton size='small' className='ms-1' onClick={checkSenderCredentials}>
                                <PublishedWithChangesIcon/>
                            </IconButton>
                        </Tooltip>
                      </div>
                    </div>
                  }
                </div>
                <p>Maximum Contacts you can select : {totalCampaignMails} </p>
            
              <button 
                type="submit" 
                className="btn btn-primary mt-2" 
                disabled={totalCampaignMails <= 0}
              >
                {CampaignDetails ? "Update" : "Submit"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CampaignForm;
