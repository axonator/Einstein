import React, { useState } from "react";
import axios from "axios";

function ContactDeletePopup({ contactIDs, fetchContacts, onclose, setcontactIDs,onDelete}) {

  const handleDelete = async () => {
    try {
      await Promise.all(
        contactIDs.map(async (id) => {
          await axios.delete(`${import.meta.env.VITE_LOCAL_URL}/api/common/${id}`, {
            data: { 
              deleteChildren: false, 
              table_name: 'contact', 
              column_name: 'id' 
            }
          });
        })
      );

      onclose(false); // Close modal after showing success
      const successMsg = `Deleted ${contactIDs.length} contacts successfully`
      const msgType = 'success'
      onDelete(successMsg, msgType)
        setcontactIDs([]);
        await fetchContacts(); // Refresh tasks after deletion
    } catch (error) {
      console.error("Error deleting task:", error);
      const errormsg = "Error deleting task. Please try again.";
      const type = 'error'
      onDelete(errormsg, type)
    }
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
              onClick={() => onclose(false)}
            ></button>
          </div>
          <div className="modal-body">
            <p>Do you really want to delete {contactIDs.length} contacts?</p>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => onclose(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactDeletePopup;
