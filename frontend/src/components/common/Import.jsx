import React, { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Input } from "@mui/material";
import axios from "axios";

function Import({ refreshContacts, setOpenImportContacts, OpenImportContacts }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Close dialog
  const handleClose = () => {
    setOpenImportContacts(false);
    setSelectedFile(null);
  };

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedExtensions = ["csv", "xls"];
    const fileExtension = file.name.split(".").pop().toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      alert("Invalid file format. Please upload a CSV or XLS file.");
      return;
    }

    setSelectedFile(file);
  };

  // Upload CSV/XLS File
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a CSV or XLS file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setUploading(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_LOCAL_URL}/api/contacts/import/csv`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      refreshContacts();
      handleClose();
    } catch (error) {
      alert(error.response?.data?.error || "Error uploading file.");
      console.log("error", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Import Dialog */}
      <Dialog open={OpenImportContacts} onClose={handleClose}>
        <DialogTitle>Import Contacts</DialogTitle>
        <DialogContent>
          <Input type="file" accept=".csv, .xls, .xlsx" onChange={handleFileChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">Cancel</Button>
          <Button onClick={handleUpload} color="primary" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Import;
