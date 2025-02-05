import React, { useState } from "react";
import axios from "axios";
import "./Signal.css"; // Add custom styles for glowing effect

function Signal({ initalColor, health, task, fetchTasks }) {
  const [activeLightColor, setActiveLightColor] = useState(initalColor); // State to track active color

  // Handle light color change on click
  const handleSignalClick = async (color) => {
    let currentLookUpId = health.lookupId;
    let healthId = 0;
    let taskId = task.task_id;
    if (color === 'red') {
      healthId = 35;
    } else if (color === 'yellow') {
      healthId = 36;
    } else {
      healthId = 37;
    }

    try {
      // Make an API call to update the database
      await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/tasks/updateTaskCustomFields/${taskId}`, { newId: healthId, customFieldId: 8 });
      
      setActiveLightColor(color); // Update the UI only on success

      // Fetch the latest tasks data after updating
      fetchTasks();  // This will re-render the Listview component
    } catch (error) {
      console.error("Failed to update task health:", error);
      alert("Failed to update the signal. Please try again.");
    }
  };

  return (
    <div className="col-1 border border-light" id="signalBox">
      <div
        className={`signal-light red ${activeLightColor === "red" ? "glow" : ""}`}
        onClick={() => handleSignalClick("red")} // Change active color on click
        style={{ cursor: "pointer" }}
      ></div>
      <div
        className={`signal-light yellow ${activeLightColor === "yellow" ? "glow" : ""}`}
        onClick={() => handleSignalClick("yellow")} // Change active color on click
        style={{ cursor: "pointer" }}
      ></div>
      <div
        className={`signal-light green ${activeLightColor === "green" ? "glow" : ""}`}
        onClick={() => handleSignalClick("green")} // Change active color on click
        style={{ cursor: "pointer" }}
      ></div>
    </div>
  );
}

export default Signal;
