import React, { useEffect, useState } from "react";

function Dropdown({
  options = [],
  onSelect,
  label = false,
  option_label,
  name_colum,
  id_column,
  id,
  preselectedId = false,
  required=false,
  CLASSNAME = false
}) {
  const [selectedOption, setSelectedOption] = useState("");
  const [showTextField, setShowTextField] = useState(false);
  const [otherValue, setOtherValue] = useState("");

  const handleChange = (event) => {
    const selected_value = event.target.value;
    const selected_id = options.find(
      (option) => option[name_colum] === selected_value
    )?.[id_column];

    setSelectedOption(selected_value);

    if (selected_value.toLowerCase() === "other") {
      setShowTextField(true);
    } else {
      setShowTextField(false);
      setOtherValue(""); // Clear the other field if not "other"
    }

    if (onSelect) {
      onSelect(id, selected_id,event); // Call the parent function with the selected value
    }
  };

  useEffect(() => {
    if (preselectedId) {
      const preselectedValue = options.find(
        (option) => option[id_column] === preselectedId
      )?.[name_colum];
      setSelectedOption(preselectedValue);
      if (preselectedValue?.toLowerCase() === "other") {
        setShowTextField(true);
      }
    }
  }, [preselectedId, options, id_column, name_colum]);

  const handleOtherChange = (event) => {
    const value = "other404" + event.target.value
    setOtherValue(event.target.value);
    if (onSelect) {
      onSelect(`${id}`, value); // Pass the other value to the parent
    }
  };

  return (
    <div className={CLASSNAME ? CLASSNAME : "mb-3"}>
      {label && 
        <label htmlFor={label} className="form-label">
          {label}
        </label>
      }
      <select
        id={label ? label:undefined}
        className="form-select"
        value={selectedOption || ""}
        onChange={handleChange}
        required = {required}
      >
        <option value="" disabled>
          {option_label}
        </option>
        {options.map((option) => (
          <option
            key={option[id_column]}
            value={option[name_colum]}
            id={option[id_column]}
          >
            {option[name_colum]}
          </option>
        ))}
      </select>

      {/* Show text field if "other" is selected */}
      {showTextField && (
        <div className="mt-3">
          <label htmlFor={`${id}_other`} className="form-label">
            {option_label}
          </label>
          <input
            type="text"
            id={`${id}_other`}
            className="form-control"
            value={otherValue}
            onChange={handleOtherChange}
            placeholder="Please specify"
            required
          />
        </div>
      )}
    </div>
  );
}

export default Dropdown;
