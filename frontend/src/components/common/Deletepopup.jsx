import React, { useState } from "react";
import axios from "axios";

function DeletePopup({ task, fetchTasks, onclose }) {
  const [deleteChildren, setDeleteChildren] = useState(false); // State to track the checkbox

  const handleDelete = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/tasks/${task.task_id}`, {
        data: { deleteChildren }, // Send the deleteChildren state to the backend
      });
      fetchTasks(); // Refresh the tasks after deletion
    } catch (error) {
      console.error("Error deleting task:", error);
    }
    onclose(false); // Close the modal after deleting
    window.location.href = `/view?scope=${task.parent_task_type || task.parent_task_type==null ?"root":task.parent_task_type}&pid=${task.parent_task_id || task.parent_task_id == null ?1:task.parent_task_id}`; // Redirect
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Confirm Deletion</h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => onclose(false)} // Close modal
            ></button>
          </div>
          <div className="modal-body">
            <p>Do you really want to delete {task.task_name}?</p>
            <div>
              <input
                type="checkbox"
                checked={deleteChildren}
                onChange={() => setDeleteChildren(!deleteChildren)} // Toggle checkbox state
              />
              <label> Delete all child tasks with this task</label>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => onclose(false)} // Close modal
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete} // Delete task
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeletePopup;
