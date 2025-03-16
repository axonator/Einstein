import { useParams } from "react-router-dom";
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import DoNotDisturbAltRoundedIcon from '@mui/icons-material/DoNotDisturbAltRounded';
import PauseCircleOutlineRoundedIcon from '@mui/icons-material/PauseCircleOutlineRounded';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import CampaignForm from "./form/CampaignForm";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Contact from "./Contact";
import { toTitleCase } from "../helper/helper";
import { MdOutlineExpandMore } from "react-icons/md";



function SingleCampaign() {
    const { campaignId } = useParams(); // Get campaignId from URL
    const [campaignDetails, setcampaignDetails] = useState({})
    const [showEditForm, setShowEditForm] = useState(false);
    const [days_of_week, setdays_of_week] = useState([]);
    const daysofweek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const excludeColumns = ['id','name','days_of_week','raw_body','max_contacts']
    const [showContactTools, setshowContactTools] = useState(false);
    const contentRef = useRef(null);
    const [maxHeight, setMaxHeight] = useState("100px");
    const [isExpanded, setIsExpanded] = useState(false);
    

    useEffect(() => {
        if (isExpanded) {
          setMaxHeight(`${contentRef.current.scrollHeight}px`);
        } else {
          setMaxHeight("250px");
        }
      }, [isExpanded]);
    

    useEffect(()=>{
        if (campaignDetails) {
            if (campaignDetails.status == 'created') {
                setshowContactTools(true)
            }
        }
    },[campaignDetails])

    const toggleExpand = () => {
        setIsExpanded((prev) => !prev);
      };

    async function handleCampaignStatusChange(newStatus) {
        const updateStatusData = {
            "table_name": 'campaign',
            "columnValues": {status:newStatus},
            "condition":{id:campaignId}
          }

        try {
            // Make an API call to update the task Fiedls
            await axios.post(`${import.meta.env.VITE_LOCAL_URL}/api/common/updateData`, updateStatusData);
            getCampaigmDetails()
        }catch (error) {
            console.error("Failed to update task custom fields:", error);
          }
    }
    
    const toggleModal = () => {
        setShowEditForm(!showEditForm);
      };

    async function getCampaigmDetails() {
        try {
            let url = `${import.meta.env.VITE_LOCAL_URL}/api/common/get_list`;
            const requestBody = { table_name: 'campaign', column_name: '*', condition: `WHERE id=${campaignId}` };

            const response = await axios.post(url, requestBody);
            const [data] = response.data
            setcampaignDetails(data);
            setdays_of_week(data['days_of_week'])
        } catch (error) {
            console.error("Error fetching campaign details:", error);
        }
    }

    useEffect(()=>{
        getCampaigmDetails();
    },[campaignId])

    const getButtonClass = (index,value) => {
        const day = daysofweek[index]
        if (value === 1) {
            return day === "Sun" ? "btn-danger" : "btn-primary";
        } else {
            return day === "Sun" ? "btn-outline-danger" : "btn-outline-secondary";
        }
    };

    return(
        <div>
            {
                showEditForm && 
                <CampaignForm toggleModal={toggleModal} refreshTasks={getCampaigmDetails} CampaignDetails={campaignDetails}/>
            }
            <div className="row m-4">
                <div className="Title col-11">
                    <h1>{campaignDetails.name}</h1>
                    <div className="d-flex flex-wrap gap-2">
                        {days_of_week.map((value, index) => (
                            <span key={index} className={`btn btn-sm ${getButtonClass(index,value)}`}>
                                {daysofweek[index]}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="col-1 d-flex justify-content-center">
                    {['created','paused'].includes(campaignDetails.status) && 
                        <Tooltip title="Start Campaign">
                            <IconButton size="small" className="ms-1" name="todo" id="todo" onClick={(event)=>{handleCampaignStatusChange("todo")}}>
                                <PlayArrowIcon sx={{ color: "green" }} />
                            </IconButton>
                        </Tooltip>

                    }

                    {['todo','inprogress', 'paused'].includes(campaignDetails.status) &&
                        
                        <Tooltip title="End Campaign">
                            <IconButton size="small" className="ms-1" name="stopped" id="stopped" onClick={(event)=>{handleCampaignStatusChange("stopped")}}>
                                <DoNotDisturbAltRoundedIcon sx={{ color: "red" }} />
                            </IconButton>
                        </Tooltip>
                    }

                    {['todo','inprogress'].includes(campaignDetails.status) &&
                        <Tooltip title="Pause Campaign">
                            <IconButton size="small" className="ms-1" name="paused" id="paused" onClick={(event)=>{handleCampaignStatusChange("paused")}}>
                                <PauseCircleOutlineRoundedIcon />
                            </IconButton>
                        </Tooltip>
                    }

                    {
                        campaignDetails.status == 'created' &&
                        <Tooltip title="Edit Campaign">
                            <IconButton size="small" className="ms-1" onClick={toggleModal}>
                                <SettingsRoundedIcon sx={{ color: "black" }} />
                            </IconButton>
                        </Tooltip>
                    }

                </div>
            </div>

            <div className="row my-4" id="all-task-details">
                {Object.entries(campaignDetails).map(([key, value]) => (
                    excludeColumns.includes(key) ? null : 
                    <div key={key} className="col-md-4">
                        <p className="m-2">
                            <strong>{toTitleCase(key).replace(/_/g, " ")}:</strong> {value || "N/A"}
                        </p>
                    </div>
                ))}
            </div>

            <div className="p-2 mb-3 border border-dashed rounded bg-light">
                <div 
                    ref={contentRef}
                    dangerouslySetInnerHTML={{ __html: campaignDetails.raw_body }} 
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

            <Contact table_name="contact c" columns="c.*,cs.body,cs.subject,cs.status,cs.date_to_send, cs.time_to_send" condition={`INNER JOIN campaign_schedule cs ON c.id = cs.fk_contact_id WHERE cs.fk_campaign_id = ${campaignId}`} showTools={showContactTools} campaignDetails={campaignDetails}/>

        </div>
    )
}

export default SingleCampaign;