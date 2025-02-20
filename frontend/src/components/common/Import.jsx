import React, { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Input } from "@mui/material";
import axios from "axios";

function Import(setOpenImportContacts, OpenImportContacts){
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Close dialog
  const handleClose = () => {
    setOpenImportContacts(false);
    setSelectedFile(null);
  };

  // Handle file selection
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  // Upload CSV File
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a CSV file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setUploading(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_LOCAL_URL}/api/contacts/import/csv`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert(response.data.message || "Contacts imported successfully.");
      handleClose();
    } catch (error) {
      alert(error.response?.data?.error || "Error uploading file.");
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
          <Input type="file" accept=".csv" onChange={handleFileChange} />
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
};

export default Import;
