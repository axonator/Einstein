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
  const [addValue, setaddValue] = useState("");

  const handleChange = (event) => {
    const selected_value = event.target.value;
    const selected_id = options.find(
      (option) => option[name_colum] === selected_value
    )?.[id_column];

    setSelectedOption(selected_value);

    if (selected_id== 404) {
      setShowTextField(true);
    } else {
      setShowTextField(false);
      setaddValue(""); // Clear the add field if not "add +"
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
      if (preselectedId == 404) {
        setShowTextField(true);
      }
    }
  }, [preselectedId, options, id_column, name_colum]);

  const handleaddChange = (event) => {
    const value = "add404" + event.target.value
    setaddValue(event.target.value);
    if (onSelect) {
      onSelect(`${id}`, value); // Pass the add value to the parent
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

      {/* Show text field if "add +" is selected */}
      {showTextField && (
        <div className="mt-3">
          <label htmlFor={`${id}_add`} className="form-label">
            {option_label}
          </label>
          <input
            type="text"
            id={`${id}_add`}
            className="form-control"
            value={addValue}
            onChange={handleaddChange}
            placeholder="Please specify"
            required
          />
        </div>
      )}
    </div>
  );
}

export default Dropdown;
