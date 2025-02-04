import { useState, useEffect } from "react";
import Signal from "./Signal";
import EditDeleteIcons from "./editDeleteIcons";
import Taskcardtopsection from "./taskCardTopSection";

function TaskCard({ task, fetchTasks,onEdit }) {
  const [signal, setSignal] = useState(null);
  const [Health, sethealth] = useState(null);

  // Extract custom fields and other task details
  const { custom_fields: customFields, ...taskWithoutCustomFields } = task;

  useEffect(() => {
    if (task.task_type_id === 1 || customFields['Health']) {
      const healthValue = customFields.Health?.value;
      sethealth(customFields.Health);

      if (healthValue?.toLowerCase() || null) {
        if (healthValue.toLowerCase() === "warning") {
          setSignal("yellow");
        } else if (healthValue.toLowerCase() === "danger") {
          setSignal("red");
        } else {
          setSignal("green");
        }
      }
    }
  }, [task, customFields]); // Re-run effect when task or customFields change

  return (
    <div className="border m-2 rounded p-3 row" key={task.task_id} id={task.task_id}>
      <EditDeleteIcons task={task} fetchTasks={fetchTasks} onEdit={onEdit}/>
      <Taskcardtopsection task={task} />
      {signal && <Signal initalColor={signal} health={Health} task={task} fetchTasks={fetchTasks} />}
    </div>
  );
}

export default TaskCard;
