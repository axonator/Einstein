import React, { useState } from "react";
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

function Text({ placeholder, name, id, onChange, value, required = false, type = "text" }) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="position-relative">
      <input
        type={type === "password" ? (showPassword ? "text" : "password") : type}
        className="form-control"
        name={name}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />
      {type === "password" && (
        <span
          className="position-absolute end-0 top-50 translate-middle-y me-2"
          style={{ cursor: "pointer" }}
          onClick={togglePasswordVisibility}
        >
          {showPassword ? <RemoveRedEyeIcon size={20}/> : <VisibilityOffIcon size={20} />}
        </span>
      )}
    </div>
  );
}

export default Text;
