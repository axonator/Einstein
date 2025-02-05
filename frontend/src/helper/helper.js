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


export {toTitleCase,isCustomFieldAvailable,getcustomFields}