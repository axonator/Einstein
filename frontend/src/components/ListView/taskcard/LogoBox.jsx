import { useState,useEffect } from "react";
import Logo from "./logo";
import EditLogoModal from "./EditLogoModal";

function LogoBox({size=80,company_website,task}) {
    const profile_url = task?.custom_fields?.["Profile Picture"]?.value;
    const imgLogoSrc = company_website ? `https://img.logo.dev/${company_website}?token=pk_CVR_tKaFQ0mBXPEs9bO4Pw&size=${size}`:false;
    const defaultLogoSrc = `/assets/no preview 1.png`
    
    const [logoSrc, setLogoSrc] = useState(defaultLogoSrc);
      // Function to validate a URL
    const isValidUrl = async (url) => {
        try {
            new URL(url); // Validates using URL constructor
            const response = await fetch(url, { method: "HEAD",mode: "no-cors" });
            if (response) {
                const contentType = response.headers.get("Content-Type");
                
                return contentType && contentType.startsWith("image/");
            }else{
                return false
            }
        } catch (err) {
            return false;
        }
    };

    // Check if profile_url exists and is valid
    useEffect(() => {
        const validateAndSetLogo = async () => {
            if (profile_url && isValidUrl(profile_url)) {
                
                setLogoSrc(profile_url);
            }
            else if (company_website && isValidUrl(imgLogoSrc)) {
                setLogoSrc(imgLogoSrc);
            } else {
                setLogoSrc(defaultLogoSrc);
            }
        };
    
        validateAndSetLogo();
    }, [profile_url]);

      const [isModalOpen, setModalOpen] = useState(false);
    
      const handleEditClick = () => setModalOpen(true);
      const handleModalClose = () => setModalOpen(false);
    return(
        <div className="d-flex col-4 p-0" id="titebox">
            <Logo src={logoSrc} onEditClick={handleEditClick} size={size}/>
            {isModalOpen && <EditLogoModal task={task} show={isModalOpen} onClose={handleModalClose} />}
        </div>
    )
}

export default LogoBox;