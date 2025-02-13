import LogoBox from "./LogoBox";
import TitleSubtitlebox from "./titleSubtitlebox";
import { Link } from "react-router-dom";

function titlebox({subtitle,task}) {
    let trimmedWebsite = false;
    try {
        const website = task.custom_fields['Company Website'].value;
        trimmedWebsite = website.replace(/https?:\/\//, '').split('/')[0];
    } catch (error) {
        trimmedWebsite = false
    }
    
    return(
        <div className="d-flex col-4 p-0" id="titebox">
            {trimmedWebsite && <LogoBox company_website={trimmedWebsite} task={task}/>}
            <Link to={`/view?scope=${task.task_type}&pid=${task.task_id}`} className='text-decoration-none' key={task.task_id}>
                <TitleSubtitlebox className="col-2" title={task.task_name} subtitle={subtitle}/>
            </Link>
        </div>
    )
}

export default titlebox;