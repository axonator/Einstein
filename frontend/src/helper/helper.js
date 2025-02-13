import axios from "axios";

function toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function isCustomFieldAvailable(filedname,customfields) {
    try {
        const customFiledValue = customfields[filedname].value
        return(toTitleCase(customFiledValue))
    } catch (error) {
        return("")
    }
}

async function getcustomFields(task_type_id,setError,setLoading) {
    
    try {
        const response = await fetch(`${import.meta.env.VITE_LOCAL_URL}/api/tasks/getCustomFields`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ taskTypeId: task_type_id }),
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch custom fields for task type id ${task_type_id}: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        setError(error.message); // Update error state in case of failure
      } finally {
        setLoading(false); // Set loading to false once the fetch is done
      }
}

async function getAppliedTags(taskid) {
    try {
      const response = await axios.post(`${import.meta.env.VITE_LOCAL_URL}/api/common/taskTags/${taskid}`);
      return response.data
    } catch (error) {
      console.error('Search error:', error);
    }
  }

  async function getAvailableTags() {
    try {
      const response = await axios.get(`${import.meta.env.VITE_LOCAL_URL}/api/common/getAvailableTags`);

      return response.data
    } catch (error) {
      console.error('Search error:', error);
    }
  }

  async function removeTag(TagId, taskid) {
    try {
        const response = await axios.delete(`${import.meta.env.VITE_LOCAL_URL}/api/common/taskTags/${taskid}`, {
            data: { tagId: TagId } // Correct way to send body in DELETE request
        });
        return response.data;
    } catch (error) {
        console.error('Remove Tag error:', error);
    }
  }

  async function applyNewTag(TagId, taskid) {
    try {
        const response = await axios.post(`${import.meta.env.VITE_LOCAL_URL}/api/common/addtaskTag/${taskid}`,{ tagId: TagId });
        return response.data;
    } catch (error) {
        console.error('Add Tag error:', error);
    }
  }

  async function addNewTag(tagName) {
    try {
        const response = await axios.post(`${import.meta.env.VITE_LOCAL_URL}/api/common/addNewTag`,{tagName});
        const  newTagId = response.data.tag_id
        return newTagId;
    } catch (error) {
        console.error('Add Tag error:', error);
    }
  }



export {toTitleCase,isCustomFieldAvailable,getcustomFields, getAppliedTags, getAvailableTags, removeTag, applyNewTag, addNewTag}